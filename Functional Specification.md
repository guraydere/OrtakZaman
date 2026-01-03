# PROJE DOKÜMANI - BÖLÜM 1: KAVRAMSAL TASARIM VE KULLANICI DENEYİMİ

## 1. Proje Özeti ve Amaç

**Proje Adı (Kod Adı):** "OrtakZaman" (veya "ZamanBul")

**Amaç:** Bir grup insanın, herhangi bir üyelik veya giriş işlemi yapmadan, ortak müsait zamanlarını en hızlı ve sürtünmesiz (frictionless) şekilde belirlemesini sağlamak.

**Temel Felsefe:** "Link'e tıkla, kim olduğunu seç, zamanı işaretle."

**Hedef:** Karmaşık takvim davetleri ve sonsuz WhatsApp mesajlaşmaları yerine, tek bir görsel arayüzde "En yeşil (en müsait)" alanı bulmak.

---

## 2. Kullanıcı Rolleri

Sistemde veritabanı düzeyinde bir "User" tablosu yoktur, ancak oturum bazlı iki rol vardır:

- **Toplantı Yöneticisi (Admin):** Buluşmayı başlatan, isimleri giren ve linki paylaşan kişidir. Toplantıyı düzenleme (isim ekleme/çıkarma) veya silme yetkisine sahiptir.

- **Katılımcı (Participant):** Linke tıklayan, listeden kendi ismini seçen ve müsaitlik durumunu giren kişidir.

---

## 3. Ekranlar ve Detaylı İş Akışları

Uygulama temel olarak 3 ana arayüz durumundan oluşur.

### Ekran A: Karşılama ve Oluşturma (Landing & Create)

Kullanıcı siteye girdiğinde artık **Karşılama Modalı** ile karşılaşır (ilk ziyaretse).

**1. Karşılama Modalı (Yeni):**
- Projenin amacını ve nasıl çalıştığını anlatır.
- "Bir daha gösterme" seçeneği (LocalStorage).
- "Yardım" butonu ile tekrar açılabilir.

**2. Form Ekranı:**
- Doğrudan toplantı oluşturma formu görünür (Hero text kaldırıldı).

**Görsel Ögeler:**

- **Buluşma Başlığı (Input):** Örn: "Halı Saha Maçı", "Proje Review".
- **Açıklama (Textarea - Opsiyonel):** Örn: "Arkadaşlar bu hafta içi akşam bir saat belirleyelim."
- **Tarih Seçici (Date Picker):** 
  - Başlangıç bugünden itibaren seçilebilir (Geçmişe izin yok).
  - En fazla 1 ay ileriye gidilebilir.
  - Seçilen aralık (Buluşma süresi) en fazla 1 hafta (7 gün) olabilir.
- **Katılımcı Listesi (Multi-Input):** Yönetici buraya isimleri yazar ve 'Enter'a basar. (Ali, Ayşe, Mehmet...).
- **Oluştur Butonu:** "Buluşma Linki Yarat".

**Aksiyon:** Butona basıldığında sistem arka planda toplantıyı oluşturur ve yöneticiyi doğrudan Ekran C'ye (Yönetici yetkileriyle) yönlendirir.

---

### Ekran B: Kimlik Sahiplenme (The Gatekeeper / Modal)

Yöneticinin paylaştığı linke tıklayan bir katılımcının gördüğü ilk katmandır. Ana takvim bulanık (blur) şekilde arkada görünür, önde bir diyalog penceresi vardır.

**Amaç:** Login olmadan kişinin kim olduğunu doğrulamak.

**Görsel Ögeler:**

- **Başlık:** "Hoş geldin! Sen hangisisin?"
- **İsim Listesi (Butonlar):** Yöneticinin girdiği isimler listelenir.
  - Boşta olanlar: Tıklanabilir, aktif buton.
  - Sahiplenilmiş olanlar: Pasif, gri renkli veya yanında "Seçildi" ikonu var.
- **"Listede yokum" Linki:** (Opsiyonel) Eğer yönetici ismini eklemeyi unuttuysa, kişi ismini buraya yazıp ekleyebilir. Eklenen isim aktivasyonu için yönetici onayı gerekir ve aynı IP'li bilinmeyen kişinin sürekli yeni kişiler eklemesi engellenir. Yönetici ekranında "Listede yoktum" özelliği açık ya da kapalı olarak buluşma bazlı ayarlanabilir.

**Aksiyon:** Kullanıcı "Ali" butonuna tıklar. Sistem tarayıcıya "Bu cihaz Ali'dir" damgasını (cookie/local storage) vurur ve modal kapanır.

---

### Ekran C: Ortak Takvim ve Seçim Arayüzü (Main Dashboard)

Uygulamanın kalbidir. Kullanıcı kimliğini seçtikten sonra buraya düşer.

**Görsel Ögeler:**

- **Üst Bilgi:** Buluşma adı ve "Hoş geldin Ali" ibaresi.

- **Zaman Izgarası (Grid):**
  - Sütunlar: Günler (Pazartesi, Salı...).
  - Satırlar: Saatler (09:00, 10:00...).

- **Isı Haritası (Heatmap) Mantığı:**
  - Hücre Beyaz: Kimse uygun değil.
  - Hücre Açık Yeşil: 1-2 kişi uygun.
  - Hücre Koyu Yeşil: Herkes veya çoğunluk uygun (Vurgulanır).

- **Katılımcı Durum Paneli (Side/Bottom Bar):**
  - Kimlerin seçim yaptığı (Check işareti).
  - Kimlerin henüz giriş yapmadığı (Saat ikonu).

- **Link Paylaş Butonu:** Linki kopyalamak için kısayol.

**Etkileşim (Interaction):**

- **Masaüstü:** Kullanıcı fare ile basılı tutup sürükleyerek (drag & select) uygun olduğu saatleri boyar. Tıpkı Excel'de hücre seçer gibi.
- **Mobil:** "Dokunma Modu" açılır. Parmağıyla dokunduğu hücreler seçilir/seçim kaldırılır.

**Anlık Geri Bildirim:** Kullanıcı bir kutuyu boyadığında, sayfa yenilenmeden o kutunun rengi "Benim Seçimim" rengine döner. Aynı zamanda ortak ısı haritası güncellenir.


---

### Ekran D: Toplantı Sonuç Ekranı (Finalized View)

Toplantı yönetici tarafından sonlandırıldığında devreye giren "Salt Okunur" ekrandır. Takvim ve diğer kontroller tamamen gizlenir.

**Görsel Ögeler:**

- **Başlık ve Açıklama:** Toplantının adı ve notu.
- **Kesinleşen Zaman:** Seçilen tarih ve saat (Büyük ve vurgulu).
- **Katılımcı Listeleri:**
  - ✅ **Gelebilecekler:** O saatte uygun olanlar.
  - ❌ **Gelemeyecekler:** O saatte uygun olmayanlar.

**Aksiyon:**
- Ekran statiktir, herhangi bir seçim veya değişiklik yapılamaz.
- "Yeni Toplantı Oluştur" butonu eklenebilir.

---


## 4. Normal Akış Senaryosu (Happy Path)

1. **Yönetici (Ahmet):** Siteye girer. "Hafta Sonu Kampı" başlığını atar. Gelecek haftayı seçer. Katılımcı olarak "Ahmet, Ayşe, Can" yazar. "Oluştur" der.

2. **Sistem:** Link üretir: `app.com/m/kamp-123`. Ahmet linki WhatsApp grubuna atar.

3. **Ahmet (Devam):** Kendi ekranında otomatik olarak "Ahmet" olarak tanınır. Cumartesi sabahını işaretler.

4. **Katılımcı (Ayşe):** Linke tıklar. Karşısına "Sen kimsin?" ekranı gelir. "Ayşe"yi seçer.

5. **Ayşe (Seçim):** Takvime bakar. Ahmet'in seçtiği Cumartesi sabahını "hafif yeşil" görür. Kendisi de orayı işaretler. O bölge artık "koyu yeşil" olur.

6. **Sonuç:** Herkes seçimini bitirince, en koyu yeşil alan (herkesin kesiştiği zaman) görsel olarak parlar. Grup, WhatsApp'tan "Tamamdır Cumartesi sabah gidiyoruz" der.

---

## 5. Sorunlar, Kenar Durumlar ve Çözümleri (Edge Cases)

Kayıt sistemi olmadığı için yaşanabilecek sorunlar ve tasarımsal çözümleri:

### Sorun 1: Yanlış Kimlik Seçimi (Ali yanlışlıkla Ayşe'ye tıkladı)

**Durum:** Ali, Ayşe'nin profiline girdi. Ayşe linke tıkladığında "Bu isim şu an başka bir cihazda aktif" uyarısı alır ve giremez.

**Çözüm:**

- **Basit Çözüm:** "Ben Ayşe'yim, Girişi Zorla (Force Login)" butonu konulur. Bu buton, önceki cihazdaki (Ali'nin cihazındaki) Ayşe oturumunu düşürür.
- **Güvenli Çözüm (Yönetici):** Yönetici panelinde, isimlerin yanında "Oturumu Sıfırla" butonu olur. Yönetici, Ayşe'nin kilidini açar.

---

### Sorun 2: Sonradan Fikir Değiştirme

**Durum:** Ali seçim yaptı, tarayıcıyı kapattı. Ertesi gün fikri değişti.

**Çözüm:** Ali aynı tarayıcıdan/telefondan girdiği sürece sistem onu hatırlar (LocalStorage/Cookie). Direkt takvimi görür ve seçimini değiştirebilir. Farklı cihazdan girerse tekrar ismini seçer (Sorun 1'deki çözüm devreye girer).

---

### Sorun 3: Ortak Zaman Bulunamaması

**Durum:** Herkes farklı zamanları işaretledi, takvimde hiç "Koyu Yeşil" alan yok.

**Çözüm:** Arayüzde "En iyi eşleşme: %66 Katılım" gibi bir istatistik gösterilir. Yani "Herkesin uyduğu saat yok ama 3 kişiden 2'sinin uyduğu şu saat var" önerisi sunulur.

---

### Sorun 4: Trol Katılımcı / Linkin Sızması

**Durum:** Link gruptan dışarı sızdı, yabancılar girip rastgele işaretliyor.

**Çözüm:** Yöneticiye "Salt Okunur Mod (Freeze)" yetkisi verilir. Yönetici oylamayı kilitler, kimse değişiklik yapamaz. Ayrıca yönetici "Bilinmeyen Katılımcı"ları listeden silebilir.
