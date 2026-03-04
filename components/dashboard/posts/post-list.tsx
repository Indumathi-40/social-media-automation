"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Linkedin, Instagram, Twitter, Calendar, Clock, MoreHorizontal, Pencil, Trash2, Send, FileEdit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface PostListProps {
    status: "PENDING" | "POSTED" | "DRAFT";
    title: string;
    description: string;
}

export function PostList({ status, title, description }: PostListProps) {
    const posts = useQuery(api.posts.getPosts, { status });

    if (posts === undefined) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 w-full bg-gray-100 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                <p className="text-muted-foreground mt-1">{description}</p>
            </div>

            {posts.length === 0 ? (
                <Card className="border-dashed border-2 bg-gray-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Clock className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900">No posts found</h3>
                        <p className="text-sm text-gray-500 max-w-[250px] mt-1">
                            You don't have any posts in your {status.toLowerCase()} category yet.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {posts.map((post) => (
                        <Card key={post._id} className="overflow-hidden hover:shadow-md transition-shadow border-gray-200">
                            <CardContent className="p-0">
                                <div className="p-5 flex items-start gap-4">
                                    <div className="flex-shrink-0 pt-1">
                                        {post.platform === "linkedin" && <div className="bg-[#0077b5] p-1.5 rounded-lg"><Linkedin className="w-5 h-5 text-white fill-current" /></div>}
                                        {post.platform === "instagram" && <div className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-1.5 rounded-lg"><Instagram className="w-5 h-5 text-white" /></div>}
                                        {post.platform === "twitter" && <div className="bg-black p-1.5 rounded-lg"><Twitter className="w-5 h-5 text-white fill-current" /></div>}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{post.platform}</span>
                                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {status === "PENDING" ? "Scheduled for" : status === "POSTED" ? "Published on" : "Created on"} {format(post.scheduledTime || post.createdAt, "MMM d, yyyy · h:mm a")}
                                                </span>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="gap-2"><Pencil className="w-4 h-4" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-destructive"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <p className="text-gray-800 text-sm leading-relaxed mb-4 line-clamp-3">
                                            {post.content}
                                        </p>

                                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                                {post.mediaUrls.map((url, i) => (
                                                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm">
                                                        <img src={url} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="px-5 py-3 bg-gray-50/50 border-t flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                        {status === "PENDING" && <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"><Calendar className="w-3 h-3" /> Scheduled</div>}
                                        {status === "POSTED" && <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><Send className="w-3 h-3" /> Published</div>}
                                        {status === "DRAFT" && <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><FileEdit className="w-3 h-3" /> Draft</div>}
                                    </div>
                                    <button className="text-xs font-bold text-purple-600 hover:text-purple-700">View Details</button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
