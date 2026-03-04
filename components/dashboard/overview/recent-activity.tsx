import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin, Instagram, Twitter, Heart, MessageSquare, MoreVertical } from "lucide-react";
import Image from "next/image";

export function RecentActivity() {
    const activities = [
        {
            content: "The future of remote workspace design is here...",
            image: "/placeholder-post-1.png", // We'll need to handle this image, or use iconic placeholder
            platform: "LinkedIn",
            platformIcon: Linkedin,
            platformColor: "text-blue-700",
            status: "Published",
            likes: 452,
            comments: 24,
            time: "1h ago"
        },
        {
            content: "Client success story: How we helped GrowCorp...",
            image: "/placeholder-post-2.png",
            platform: "Instagram",
            platformIcon: Instagram,
            platformColor: "text-pink-500",
            status: "Published",
            likes: "1.2k",
            comments: 82,
            time: "4h ago"
        },
        {
            content: "5 tips for better social media engagement in 2024",
            image: "/placeholder-post-3.png",
            platform: "Twitter",
            platformIcon: Twitter,
            platformColor: "text-sky-500",
            status: "Scheduled",
            statusColor: "bg-yellow-100 text-yellow-700",
            likes: "-",
            comments: "-",
            time: "Tomorrow"
        }
    ];

    return (
        <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-gray-800">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="min-w-full">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        <div className="col-span-6">Post Content</div>
                        <div className="col-span-2">Channel</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1">Metrics</div>
                        <div className="col-span-1 text-right">Date</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-50">
                        {activities.map((item, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors group">

                                {/* Content */}
                                <div className="col-span-6 flex items-center gap-4">
                                    <div className="h-10 w-10 bg-orange-100 rounded-md flex items-center justify-center shrink-0">
                                        {/* Placeholder for post image */}
                                        <div className="h-4 w-4 rounded-full bg-orange-300" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 truncate pr-4">{item.content}</span>
                                </div>

                                {/* Channel */}
                                <div className="col-span-2 flex items-center gap-2">
                                    <item.platformIcon className={`h-4 w-4 ${item.platformColor}`} />
                                    <span className="text-sm text-gray-600">{item.platform}</span>
                                </div>

                                {/* Status */}
                                <div className="col-span-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {item.status}
                                    </span>
                                </div>

                                {/* Metrics */}
                                <div className="col-span-1 flex items-center gap-3 text-gray-400 text-xs">
                                    <div className="flex items-center gap-1">
                                        <Heart className="h-3.5 w-3.5" />
                                        <span>{item.likes}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>{item.comments}</span>
                                    </div>
                                </div>

                                {/* Date & Action */}
                                <div className="col-span-1 text-right flex items-center justify-end gap-2">
                                    <span className="text-sm text-gray-500">{item.time}</span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
