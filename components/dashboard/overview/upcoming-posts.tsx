"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Building2, Linkedin, Instagram, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export function UpcomingPosts() {
    const posts = useQuery(api.posts.getUpcomingPosts);

    if (posts === undefined) {
        return (
            <Card className="shadow-sm border-0 bg-white h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                    <CardTitle className="text-base font-bold text-gray-800">Upcoming Posts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 w-full bg-gray-50 animate-pulse rounded-xl" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border-0 bg-white h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
                <CardTitle className="text-base font-bold text-gray-800">Upcoming Posts</CardTitle>
                <Link href="/dashboard/queue" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">View All</Link>
            </CardHeader>
            <CardContent className="space-y-4">
                {posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Clock className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No scheduled posts</p>
                    </div>
                ) : (
                    posts.slice(0, 5).map((post, i) => (
                        <div key={post._id} className="flex gap-4 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className={`h-10 w-10 min-w-10 rounded-lg flex items-center justify-center ${post.platform === 'linkedin' ? 'bg-blue-100' :
                                    post.platform === 'instagram' ? 'bg-pink-100' : 'bg-gray-100'
                                }`}>
                                {post.platform === 'linkedin' && <Linkedin className="h-5 w-5 text-blue-600 fill-current" />}
                                {post.platform === 'instagram' && <Instagram className="h-5 w-5 text-pink-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-gray-900 truncate">{post.content}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 font-medium">
                                        {format(post.scheduledTime, "MMM d, h:mm a")}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{post.platform}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
