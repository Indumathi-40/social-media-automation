import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string;
    change?: string;
    sub?: string;
    trend: "up" | "down" | "neutral";
    data: number[];
    color: string;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
    const height = 40;
    const width = 100;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * height;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}

export function StatsCards() {
    const stats: StatsCardProps[] = [
        {
            title: "Total Reach",
            value: "84.2k",
            change: "~12%",
            trend: "up",
            data: [30, 40, 35, 50, 45, 60, 55],
            color: "#10b981", // Emerald 500
        },
        {
            title: "Engagement Rate",
            value: "5.8%",
            change: "~4.1%",
            trend: "up",
            data: [20, 25, 30, 28, 40, 35, 45],
            color: "#10b981",
        },
        {
            title: "Scheduled Posts",
            value: "14",
            sub: "Today",
            trend: "neutral",
            data: [10, 15, 10, 12, 10, 14, 12],
            color: "#94a3b8", // Slate 400
        },
        {
            title: "New Followers",
            value: "1,204",
            change: "~2%",
            trend: "down",
            data: [40, 35, 30, 25, 30, 20, 25],
            color: "#f43f5e", // Rose 500
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
                <Card key={i} className="shadow-sm border-0 bg-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-gray-500">{stat.title}</span>
                            {stat.change && (
                                <span className={cn("text-xs font-bold", stat.trend === "up" ? "text-emerald-500" : "text-rose-500")}>
                                    {stat.change}
                                </span>
                            )}
                            {stat.sub && (
                                <span className="text-xs font-bold text-gray-400">
                                    {stat.sub}
                                </span>
                            )}
                        </div>
                        <div className="flex items-end justify-between gap-4">
                            <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                            <div className="h-[40px] w-[80px]">
                                <Sparkline data={stat.data} color={stat.color} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
