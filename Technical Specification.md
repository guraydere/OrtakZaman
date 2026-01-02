# PROJE DOKÜMANI - BÖLÜM 2: TEKNİK ALTYAPI VE MİMARİ

Bu bölüm, "OrtakZaman" uygulamasının kodlanmadan önceki teknik iskeletidir. Geliştirici (siz veya bir başkası) bu kılavuzu takip ederek projeyi inşa edebilir.

---

## 1. Teknoloji Yığını (Tech Stack)

**Frontend & Backend Framework:** Next.js 14+ (App Router)
- Neden: Hem arayüzü hem de API mantığını tek çatı altında (Monorepo) yönetmek ve Server Actions ile backend'e güvenli erişim sağlamak için.

**Veritabanı:** Redis (Stack / RedisJSON)
- Neden: JSON verilerini doğrudan saklayabilmek ve milisaniyelik okuma/yazma hızı.
- İmaj: `redis/redis-stack-server` (Docker) - JSON modülü yüklü gelir.

**Real-Time İletişim:** Socket.io (veya hafif alternatif olarak ws) + Redis Pub/Sub
- Neden: Bir kullanıcı takvimi boyadığında diğerlerinin ekranını anında güncellemek için.

**Stil:** Tailwind CSS
- Neden: Hızlı prototipleme ve mobil uyumlu Grid yapısı için.

**Deployment:** Docker & Docker Compose (Hetzner Sunucusu)

---

## 2. Veri Modeli Tasarımı (Redis Schema)

Projede ilişkisel veritabanı (SQL) yerine Belge Tabanlı (Document Store) yapı kullanılacaktır. Her buluşma, Redis içinde tek bir JSON nesnesi olarak saklanır.

**Anahtar Formatı (Key):** `meeting:{uuid}` (Örn: `meeting:550e8400-e29b...`)

### JSON Veri Yapısı

```json
{
  "meta": {
    "title": "Halı Saha Maçı",
    "description": "Perşembe akşamı için",
    "adminToken": "SECRET_ADMIN_TOKEN_123",
    "createdAt": 1715620000,
    "expiresAt": 1716224800,
    "status": "active",
    "allowGuest": true
  },
  "schedule": {
    "type": "weekly",
    "dates": ["2024-05-20", "2024-05-21", "..."]
  },
  "participants": {
    "user_uuid_1": {
      "name": "Ali",
      "status": "approved",
      "deviceToken": "BROWSER_COOKIE_TOKEN_ABC",
      "slots": ["d0_h18", "d0_h19", "d1_h20"]
    },
    "user_uuid_2": {
      "name": "Ayşe",
      "status": "approved",
      "deviceToken": null,
      "slots": []
    }
  },
  "guestRequests": [
    {
      "tempId": "req_999",
      "name": "Can",
      "ip": "192.168.1.1",
      "timestamp": 1715620100
    }
  ]
}
```

**Açıklamalar:**
- `adminToken`: Yönetici yetkisi için gizli anahtar
- `expiresAt`: Toplantı tarihi geçince silinmesi için
- `status`: `active` veya `frozen` (yönetici kilitledi)
- `allowGuest`: "Listede yokum" özelliği açık mı?
- `deviceToken`: O cihazı tanıyan imza
- `slots`: Seçtiği saatler (GünIndex_Saat formatında)

---

## 3. Sistem Mimarisi ve Akış Diyagramı

Sistem 3 ana parçadan oluşur: İstemci (Browser), Next.js Server ve Redis.

### A. Kimlik ve Güvenlik Mekanizması

Login olmadığı için güvenlik "Token"lar üzerinden yürür.

- **Admin Token:** Toplantı yaratıldığında üretilir. Sadece yaratıcının localStorage'ına ve veritabanına kaydedilir. Yönetici işlemleri (silme, dondurma, onaylama) için bu token Header'da gönderilir.

- **User Device Token:** Bir kullanıcı ismini seçtiğinde (Claim), tarayıcıda rastgele bir uuid üretilir ve Redis'teki ilgili kullanıcının deviceToken alanına yazılır. Sonraki tüm isteklerde bu token kontrol edilir.

### B. "Listede Yokum" (Guest Request) Mantığı ve Rate Limiting

Sistemin kötüye kullanımını engellemek için Redis'in basit Key-Value özelliği kullanılır.

**Kullanıcı "Listeye Ekle" dediğinde:**

1. Next.js, kullanıcının IP adresini alır.
2. Redis'te `ratelimit:guest_request:{IP_ADDRESS}` anahtarına bakar.
3. Eğer anahtar varsa ve limiti aştıysa -> Hata (429 Too Many Requests).
4. Limit aşılmadıysa -> JSON içindeki `guestRequests` dizisine ekler.
5. Yöneticiye socket üzerinden bildirim gider ("Can isimli biri girmek istiyor").

---

## 4. API Endpoints ve Server Actions

Next.js Server Actions kullanılarak doğrudan fonksiyon çağrısı gibi çalışılacaktır.

### 1. `createMeeting(data)`

- UUID ve AdminToken üretir.
- Redis'e `JSON.SET` ile başlangıç verisini yazar.
- TTL (Expire) süresini ayarlar.

### 2. `claimIdentity(meetingId, userId)`

- İstemci tarafında üretilen token'ı alır.
- Redis'te o kullanıcının `deviceToken` alanı boş mu diye bakar.
- Boşsa token'ı yazar (Kilitler). Doluysa hata döner.

### 3. `updateAvailability(meetingId, userId, slots, token)`

- Token doğrulaması yapar (İstemcideki token == Redis'teki deviceToken mı?).
- RedisJSON komutları ile sadece o kullanıcının slots dizisini günceller (Tüm veriyi ezip yazmaz, sadece ilgili alanı günceller - Performans için kritik).
- **ÖNEMLİ:** İşlem başarılıysa Redis Pub/Sub kanalına UPDATE mesajı atar.

### 4. `requestGuestAccess(meetingId, name)`

- IP kontrolü yapar.
- `guestRequests` listesine push eder.

### 5. `manageGuest(meetingId, requestId, action, adminToken)`

- Admin token'ı doğrular.
- Action "approve" ise ismi `participants` listesine taşır.
- Action "reject" ise listeden siler.

---

## 5. Real-Time İletişim (WebSocket Entegrasyonu)

Next.js stateless olduğu için WebSocket sunucusunu ayrı bir process veya Next.js Custom Server içinde çalıştırmak gerekir.

**Akış:**

1. Kullanıcı A takvimi boyar -> `updateAvailability` action çalışır.
2. Server Action -> Redis Veritabanını günceller.
3. Server Action -> Redis `PUBLISH` komutu ile `meeting_updates` kanalına mesaj atar: `{"meetingId": "xyz", "sender": "Ali"}`.
4. Socket Sunucusu (Redis SUBSCRIBE modunda dinler) -> Mesajı alır.
5. Socket Sunucusu -> `meeting_xyz` odasındaki (room) tüm bağlı tarayıcılara `REFRESH_DATA` sinyali yollar.
6. Tarayıcılar -> Sinyali alınca en güncel veriyi çeker (Revalidation).

---

## 6. Proje Klasör Yapısı (Öneri)

```
/src
  /app
    /page.tsx            (Landing)
    /m/[id]/page.tsx     (Toplantı Ana Ekranı - Ekran C)
    /m/[id]/join/page.tsx (Kimlik Seçimi - Ekran B)
  /components
    /CalendarGrid.tsx    (Etkileşimli ızgara)
    /Heatmap.tsx         (Görsel hesaplama katmanı)
    /AdminPanel.tsx      (Onay/Red butonları)
  /lib
    redis.ts             (Redis bağlantı ve fonksiyonları)
    socket.ts            (Client-side socket bağlantısı)
    utils.ts             (Tarih/saat yardımcıları)
  /actions
    meetingActions.ts    (Server Actions)
```

---

## 7. Deployment (Docker Compose)

Hetzner sunucunda projeyi ayağa kaldırmak için `docker-compose.yml`:

### Production Yapılandırması

```yaml
version: '3.8'

services:
  # Next.js Uygulaması
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis_db:6379
    depends_on:
      - redis_db

  # Redis Veritabanı (JSON Modüllü)
  redis_db:
    image: redis/redis-stack-server:latest
    ports:
      - "6379:6379"
    volumes:
      - ./redis_data:/data
    command: ["redis-stack-server", "--appendonly", "yes"]
```

### Development Yapılandırması (RedisInsight dahil)

```yaml
version: '3.8'

services:
  # Senin Next.js Uygulaman
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis_db:6379
    depends_on:
      - redis_db
    # Geliştirme modunda hot-reload için volume
    volumes:
      - ./:/app
      - /app/node_modules

  # Redis Stack (JSON modülü içinde gelir)
  redis_db:
    image: redis/redis-stack-server:latest
    container_name: ortakzaman_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # ARAYÜZ: RedisInsight
  # Tarayıcıdan http://localhost:8001 adresine girip yöneteceksin.
  redis_insight:
    image: redis/redisinsight:latest
    container_name: ortakzaman_insight
    ports:
      - "8001:5540"
    depends_on:
      - redis_db

volumes:
  redis_data:
```

---

## EKLER

### A. Saat Dilimi (Timezone) Tuzağı

Bu tür uygulamaların en büyük baş belasıdır. Sen İstanbul'da "14:00" seçersin, sunucu Almanya'da (Hetzner) olduğu için onu "11:00 UTC" kaydeder. Londra'daki arkadaşın girdiğinde bunu doğru görmeli.

**Öneri:** Veritabanına ASLA yerel saat kaydetme.

**Kural:** Frontend'den Backend'e veri giderken ISO String (UTC) olarak gitsin. Frontend'de gösterirken kullanıcının tarayıcı saatine çevir.

**Format:** `2024-05-20T14:00:00Z` (Sonundaki Z, UTC olduğunu belirtir).

---

### B. "WhatsApp İçin Özet" Butonu

İş akışında son adım genelde WhatsApp'a dönmektir. Kullanıcılar en uygun saati bulduktan sonra bunu elle yazmaya üşenir.

**Öneri:** Sonuç ekranına "Özeti Kopyala" butonu koy.

**Çıktı:**

```
📅 Halı Saha Maçı
✅ En Uygun Zaman: Cuma 21:00 (5/5 Kişi)
❌ Eksik Kişiler: Ahmet
Link: app.com/m/xyz
```

Bu özellik uygulamanın viral olmasını sağlar.

---

### C. Optimistic UI (İyimser Arayüz)

Redis hızlıdır ama ağ gecikmesi olabilir. Kullanıcı bir kutucuğa tıkladığında sunucudan "OK" yanıtı gelmesini bekleme.

**Öneri:** Tıklandığı an rengi yeşile çevir (State'i güncelle). Arka planda sunucuya isteği at. Eğer sunucudan hata gelirse (çok nadir) rengi geri al ve uyarı göster. Bu, uygulamanın "yağ gibi akmasını" sağlar.

---

### D. Mobil Grid Sorunu

Dokümanda "Mobil: Dokunma Modu" dedik ama 7 gün x 15 saatlik bir tablo mobilde çok küçük kalır.

**Öneri:** Mobilde tabloyu "Yatay Scroll" (X-Scroll) yapmak yerine, Gün Bazlı Tab (Sekme) yapısı düşünebilirsin.

```
[Pzt] [Sal] [Çar] ... (Üstte sekmeler)
```

Altında sadece o günün saatleri alt alta listelenir.

Bu, parmakla seçimi %100 kolaylaştırır.
