import { getGlobalStats, getStatsRange } from "@/lib";
import type { DailyStats, GlobalStats } from "@/lib";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAnalyticsData(): Promise<{
    global: GlobalStats;
    daily: DailyStats[];
}> {
    const [global, daily] = await Promise.all([
        getGlobalStats(),
        getStatsRange(7),
    ]);
    return { global, daily };
}

export default async function AdminPage() {
    const { global, daily } = await getAnalyticsData();

    // Calculate totals from last 7 days
    const weeklyTotals = daily.reduce(
        (acc, day) => ({
            views: acc.views + day.views,
            created: acc.created + day.created,
            votes: acc.votes + day.votes,
            participants: acc.participants + day.participants,
            mobile: acc.mobile + day.deviceMobile,
            desktop: acc.desktop + day.deviceDesktop,
        }),
        { views: 0, created: 0, votes: 0, participants: 0, mobile: 0, desktop: 0 }
    );

    return (
        <main className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    📊 OrtakZaman Analytics
                </h1>

                {/* Global Stats */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Toplam İstatistikler
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="Toplam Buluşma"
                            value={global.meetingsCreated}
                            icon="📅"
                        />
                        <StatCard
                            title="Toplam Oy"
                            value={global.totalVotes}
                            icon="✅"
                        />
                        <StatCard
                            title="Toplam Katılımcı"
                            value={global.totalParticipants}
                            icon="👥"
                        />
                    </div>
                </section>

                {/* Weekly Summary */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Son 7 Gün Özeti
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard title="Görüntüleme" value={weeklyTotals.views} small />
                        <StatCard title="Yeni Buluşma" value={weeklyTotals.created} small />
                        <StatCard title="Oylar" value={weeklyTotals.votes} small />
                        <StatCard title="Katılımcı" value={weeklyTotals.participants} small />
                        <StatCard title="Mobil" value={weeklyTotals.mobile} small />
                        <StatCard title="Masaüstü" value={weeklyTotals.desktop} small />
                    </div>
                </section>

                {/* Daily Breakdown */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Günlük Detay
                    </h2>
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Tarih</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Görüntüleme</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Buluşma</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Oylar</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Katılımcı</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Mobil</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Masaüstü</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {daily.map((day) => (
                                    <tr key={day.date} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {formatDate(day.date)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">{day.views}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">{day.created}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">{day.votes}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">{day.participants}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">{day.deviceMobile}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">{day.deviceDesktop}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

function StatCard({
    title,
    value,
    icon,
    small = false,
}: {
    title: string;
    value: number;
    icon?: string;
    small?: boolean;
}) {
    return (
        <div className={`bg-white rounded-lg shadow p-${small ? "3" : "4"}`}>
            {icon && <span className="text-2xl">{icon}</span>}
            <p className={`text-gray-500 ${small ? "text-xs" : "text-sm"} mt-1`}>{title}</p>
            <p className={`font-bold ${small ? "text-lg" : "text-2xl"} text-gray-900`}>
                {value.toLocaleString("tr-TR")}
            </p>
        </div>
    );
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}
