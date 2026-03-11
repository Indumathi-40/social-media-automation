import { StatsCards } from "@/components/dashboard/overview/stats-cards";
import { PerformanceChart } from "@/components/dashboard/overview/performance-chart";
import { UpcomingPosts } from "@/components/dashboard/overview/upcoming-posts";
import { RecentActivity } from "@/components/dashboard/overview/recent-activity";

export default function DashboardPage() {
    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
                    <p className="text-muted-foreground mt-1">Welcome back, here's what's happening today.</p>
                </div>
                <div className="bg-white border rounded-lg p-0.5 flex text-sm font-medium self-start sm:self-auto">
                    <button className="px-3 py-1.5 bg-gray-100/80 text-gray-900 rounded-md shadow-sm">Last 7 days</button>
                    <button className="px-3 py-1.5 text-gray-500 hover:text-gray-900">Last 30 days</button>
                </div>
            </div>

            {/* Stats Cards */}
            <StatsCards />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <PerformanceChart />
                </div>
                <div className="lg:col-span-1">
                    <UpcomingPosts />
                </div>
            </div>

            {/* Recent Activity */}
            <RecentActivity />

        </div>
    );
}
