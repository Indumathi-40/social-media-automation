"use client";

import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useConvexAuth, useAction } from "convex/react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    LayoutList,
    Calendar as CalendarIcon,
    Plus,
    Tag,
    Globe,
    Settings,
    MoreVertical,
    Clock,
    Clapperboard,
    HelpCircle,
    X,
    Twitter,
    Pencil,
    Zap,
    Trash2,
    Smile,
    MessageSquare,
    ExternalLink
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatePostDialog } from "@/components/dashboard/create-post/create-post-dialog";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export default function TwitterPage() {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("Queue");
    const [isMounted, setIsMounted] = useState(false);

    const { user, isLoaded } = useUser();
    const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();
    const disconnectMutation = useMutation(api.users.disconnectTwitter);

    // Derived State from URL
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");
    const code = searchParams.get("code");

    // Connection UI
    const connection = useQuery(api.twitter.getConnection, isLoaded ? undefined : "skip");

    // Fetch Posts
    const queuedPosts = useQuery(api.twitter.getPosts, { status: "PENDING" });
    const sentPosts = useQuery(api.twitter.getPosts, { status: "POSTED" });
    const draftPosts = useQuery(api.twitter.getPosts, { status: "DRAFT" });

    // Mutations
    const updatePost = useMutation(api.twitter.updatePost);
    const createPost = useMutation(api.twitter.createPost);
    const deletePost = useMutation(api.twitter.deletePost);

    // ...

    const performPublish = useAction(api.twitter.publishPost);

    const [editingPost, setEditingPost] = useState<any>(null);

    const handleEdit = (post: any) => {
        setEditingPost(post);
        setIsCreatePostOpen(true);
    };

    const handleDelete = async (postId: any) => {
        if (confirm("Are you sure you want to delete this post?")) {
            await deletePost({ postId });
        }
    };

    const handleDuplicate = (post: any) => {
        confirm("Duplicate this post?") && onDuplicate(post);
    };

    const onDuplicate = async (post: any) => {
        await createPost({
            content: post.content,
            mediaStorageIds: post.mediaStorageIds,
            mediaUrls: post.mediaUrls,
            scheduledTime: Date.now(),
            status: "DRAFT"
        });
    };

    const onPublishNow = async (postId: any) => {
        if (confirm("Publish this post immediately to X?")) {
            try {
                // @ts-ignore
                const result = await performPublish({ postId });
                if (result.success) {
                    alert("Published!");
                } else {
                    alert("Failed to publish: " + result.error);
                }
            } catch (e) {
                alert("Failed to publish: " + e);
            }
        }
    };



    const formatScheduledDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        const isTomorrow = date.getDate() === now.getDate() + 1 && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

        const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        if (isToday) return `Today, ${timeStr}`;
        if (isTomorrow) return `Tomorrow, ${timeStr}`;

        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    };


    useEffect(() => {
        setIsMounted(true);
    }, [isLoaded]);

    if (!isMounted) {
        return null;
    }

    if (isLoaded && connection === undefined) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-gray-500 font-medium">Loading Connection...</p>
            </div>
        );
    }

    const isConnected = !!connection;

    const tabs = [
        { name: "Queue", count: queuedPosts?.length || 0 },
        { name: "Drafts", count: draftPosts?.length || 0 },
        { name: "Sent", count: sentPosts?.length || 0 },
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Top Header */}
            <div className="flex flex-col border-b">
                {errorParam && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-2">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    <span className="font-bold">Connection Error:</span> {decodeURIComponent(errorParam)}
                                </p>
                                {errorParam === "config_mismatch" && (
                                    <div className="mt-2 text-xs bg-white p-2 rounded border border-red-200">
                                        Server/Ngrok URL mismatch. Check .env vs URL.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-start gap-3">
                        <div className="relative">
                            <Avatar className="h-10 w-10 border border-gray-200">
                                {connection ? (
                                    <AvatarImage src={connection.profileImageUrl} alt={connection.name} />
                                ) : null}
                                <AvatarFallback>{connection?.name?.substring(0, 2).toUpperCase() || "X"}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 shadow-sm border border-gray-100">
                                <span className="text-white text-[10px] p-0.5 h-3 w-3 flex items-center justify-center font-bold">𝕏</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900 leading-none">
                                    {connection ? connection.name : "Not Connected"}
                                </h1>
                                {connection && (
                                    <span className="text-sm text-gray-500">@{connection.username}</span>
                                )}

                                {/* Connect Button if not connected */}
                                {!isConnected && (
                                    <a href="/api/auth/x">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 text-xs bg-black text-white hover:bg-gray-800 hover:text-white border-none"
                                        >
                                            Connect X
                                        </Button>
                                    </a>
                                )}
                                {isConnected && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={async () => {
                                                if (confirm("Disconnect Twitter account?")) {
                                                    try {
                                                        if (user?.id) {
                                                            await disconnectMutation({ clerkId: user.id });
                                                        }
                                                        window.location.reload();
                                                    } catch (error) {
                                                        console.error("Failed to disconnect:", error);
                                                        alert("Failed to disconnect.");
                                                    }
                                                }
                                            }} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                                                Disconnect
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                            {isConnected && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-xs font-medium text-emerald-600">Sync is active</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsCreatePostOpen(true)}
                            className="bg-black hover:bg-gray-800 text-white font-bold shadow-md gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Tweet
                        </Button>
                    </div>
                </div>
            </div>

            {/* Secondary Toolbar & Tabs */}
            <div className="px-6 border-b flex items-center justify-between bg-white">
                <div className="flex items-center gap-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`
                        relative py-4 text-sm font-medium flex items-center gap-2 transition-colors
                        ${activeTab === tab.name ? "text-blue-500" : "text-gray-500 hover:text-gray-700"}
                    `}
                        >
                            {tab.name}
                            {tab.count !== undefined && (
                                <span className={`
                            px-2 py-0.5 rounded-full text-xs
                            ${activeTab === tab.name ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}
                        `}>
                                    {tab.count}
                                </span>
                            )}
                            {activeTab === tab.name && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content - Timeline View */}
            <div className="flex-1 overflow-y-auto bg-gray-50/30 p-8">
                <div className="space-y-6">
                    {activeTab === "Queue" && (
                        <div className="space-y-8 relative">
                            {(() => {
                                if (!queuedPosts || queuedPosts.length === 0) {
                                    return (
                                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                            <p className="text-gray-500">No scheduled tweets.</p>
                                            <Button variant="link" onClick={() => setIsCreatePostOpen(true)} className="text-blue-500">Create one?</Button>
                                        </div>
                                    );
                                }

                                const groups: Record<string, typeof queuedPosts> = {};
                                queuedPosts.forEach(post => {
                                    const date = new Date(post.scheduledTime);
                                    const key = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
                                    if (!groups[key]) groups[key] = [];
                                    groups[key].push(post);
                                });

                                return Object.entries(groups).map(([dateLabel, posts]) => (
                                    <div key={dateLabel}>
                                        <h4 className="text-gray-900 font-bold mb-4">{dateLabel}</h4>
                                        <div className="space-y-6">
                                            {posts.map((post) => (
                                                <div key={post._id} className="flex gap-6 group">
                                                    <div className="w-[80px] text-right flex-shrink-0 pt-2">
                                                        <div className="font-bold text-gray-900 text-sm">
                                                            {new Date(post.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                                        <div className="p-3.5 flex gap-4">
                                                            <div className="flex-shrink-0">
                                                                <Avatar className="h-8 w-8 border border-gray-100">
                                                                    <AvatarImage src={connection?.profileImageUrl || user?.imageUrl} />
                                                                    <AvatarFallback>U</AvatarFallback>
                                                                </Avatar>
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                                                                    {post.content}
                                                                </p>
                                                                {post.mediaUrl && (
                                                                    <img src={post.mediaUrl} alt="Media" className="mt-2 rounded-lg max-h-[200px] border border-gray-100" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                Created {formatScheduledDate(post._creationTime)}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button variant="outline" size="sm" onClick={() => onPublishNow(post._id)}>
                                                                    <Zap className="w-3.5 h-3.5 mr-1" /> Publish Now
                                                                </Button>
                                                                <Button variant="outline" size="icon" onClick={() => handleEdit(post)}>
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button variant="outline" size="icon" onClick={() => handleDelete(post._id)} className="text-red-600 hover:bg-red-50">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}

                    {activeTab === "Drafts" && (
                        <div className="space-y-8 relative">
                            {(() => {
                                if (!draftPosts || draftPosts.length === 0) {
                                    return (
                                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                            <p className="text-gray-500">No drafts yet.</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="space-y-6">
                                        {draftPosts.map((post) => (
                                            <div key={post._id} className="flex gap-6 group">
                                                <div className="w-[80px] text-right flex-shrink-0 pt-2">
                                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Draft</span>
                                                </div>
                                                <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content || <span className="text-gray-400 italic">Empty</span>}</p>
                                                    <div className="flex justify-end mt-4 gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleEdit(post)}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                                                        <Button variant="outline" size="sm" onClick={() => handleDelete(post._id)} className="text-red-600"><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}
                        </div>
                    )}

                    {activeTab === "Sent" && (
                        <div className="space-y-8 relative">
                            {(() => {
                                if (!sentPosts || sentPosts.length === 0) {
                                    return (
                                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                            <p className="text-gray-500">No sent tweets yet.</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="space-y-6">
                                        {sentPosts.map((post) => (
                                            <div key={post._id} className="flex gap-6 group">
                                                <div className="w-[80px] text-right flex-shrink-0 pt-2 text-sm font-bold text-gray-900">
                                                    {new Date(post.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                </div>
                                                <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
                                                    {post.mediaUrl && <img src={post.mediaUrl} className="mt-2 h-24 rounded border border-gray-100" />}
                                                    <div className="flex justify-end mt-4 gap-2">
                                                        {post.platformPostId && (
                                                            <>
                                                                {post.platformPostId.startsWith("mock_id_") ? (
                                                                    <Button variant="outline" size="sm" disabled title="This post was a simulation and does not exist on X">
                                                                        <ExternalLink className="w-3 h-3 mr-1" /> Test Post (Not on X)
                                                                    </Button>
                                                                ) : (
                                                                    <Button variant="outline" size="sm" onClick={() => window.open(`https://x.com/i/web/status/${post.platformPostId}`, '_blank')}>
                                                                        <ExternalLink className="w-3 h-3 mr-1" /> View on X
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}
                        </div>
                    )}
                </div>
            </div>

            <CreatePostDialog
                open={isCreatePostOpen}
                onOpenChange={(open) => {
                    setIsCreatePostOpen(open);
                    if (!open) setEditingPost(null);
                }}
                initialChannel="twitter"
                instagramConnected={false}
                linkedinConnected={false} // We are on Twitter page
                twitterConnected={isConnected}
                post={editingPost}
                key={editingPost ? editingPost._id : "create-new-twitter"}
            />
        </div>
    );
}
