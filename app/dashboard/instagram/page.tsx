"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    Pencil,
    Zap,
    Trash2,
    Smile,
    MessageSquare,
    ExternalLink,
    RefreshCw,
    Info
} from "lucide-react";
import { CreatePostDialog } from "@/components/dashboard/create-post/create-post-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQuery, useConvexAuth, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export default function InstagramPage() {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("Queue");
    const [isMounted, setIsMounted] = useState(false);

    const { user, isLoaded } = useUser();
    const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();

    // URL Params for detecting errors
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");

    // Fetch Connection Data
    const connection = useQuery(api.instagram.getConnection, isLoaded ? undefined : "skip");

    // Fetch Posts
    const queuedPosts = useQuery(api.instagram.getPosts, { status: "PENDING" });
    const sentPosts = useQuery(api.instagram.getPosts, { status: "POSTED" });
    const draftPosts = useQuery(api.instagram.getPosts, { status: "DRAFT" });

    // Mutations
    const disconnectMutation = useMutation(api.instagram.disconnect);
    const disconnectUserMutation = useMutation(api.users.disconnectInstagram);
    const deletePost = useMutation(api.instagram.deletePost);
    const updatePost = useMutation(api.instagram.updatePost);
    const performPublish = useAction(api.instagram.debugPublishPost);
    const createPost = useMutation(api.instagram.createPost);

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

    const handleDuplicate = async (post: any) => {
        if (confirm("Duplicate this draft?")) {
            await createPost({
                content: post.content,
                mediaStorageIds: post.mediaStorageIds,
                mediaUrls: post.mediaUrls,
                scheduledTime: Date.now(),
                status: "DRAFT"
            });
        }
    };

    const onPublishNow = async (postId: any) => {
        if (confirm("Publish this post immediately?")) {
            try {
                await performPublish({ postId });
                alert("Published!");
            } catch (e) {
                alert("Failed to publish: " + e);
            }
        }
    };

    const onAddToQueue = async (post: any) => {
        await updatePost({
            postId: post._id,
            status: "PENDING",
            scheduledTime: post.scheduledTime < Date.now() ? Date.now() + 3600000 : post.scheduledTime
        });
        setActiveTab("Queue");
    };

    const onMoveToDraft = async (post: any) => {
        await updatePost({
            postId: post._id,
            status: "DRAFT"
        });
        setActiveTab("Drafts");
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
                <p className="text-gray-500 font-medium">Loading Instagram Connection...</p>
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
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-start gap-3">
                        <div className="relative">
                            <Avatar className="h-10 w-10 border border-gray-200">
                                {connection ? (
                                    <AvatarImage src={connection.profilePictureUrl} alt={connection.username} />
                                ) : null}
                                <AvatarFallback>{connection?.username?.substring(0, 2).toUpperCase() || "IG"}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0 flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden w-4 h-4">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" className="w-full h-full object-cover" alt="Instagram" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900 leading-none">
                                    {connection ? connection.username : "Not Connected"}
                                </h1>

                                {/* Connect Button if not connected */}
                                {!isConnected && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-xs"
                                        onClick={() => window.location.href = "/api/auth/instagram"}
                                    >
                                        Connect
                                    </Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={async () => {
                                            if (confirm("Are you sure you want to disconnect your Instagram account?")) {
                                                try {
                                                    await disconnectMutation();
                                                    if (user?.id) {
                                                        await disconnectUserMutation({ clerkId: user.id });
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
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-xs font-medium text-emerald-600">Instagram Business Account</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600">
                            <HelpCircle className="w-5 h-5" />
                        </button>
                        <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                            <Button variant="ghost" size="sm" className="h-8 bg-white shadow-sm text-purple-600 gap-2">
                                <LayoutList className="w-4 h-4" />
                                List
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-gray-600 gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                Calendar
                            </Button>
                        </div>
                        <Button
                            onClick={() => setIsCreatePostOpen(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Post
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
                        ${activeTab === tab.name ? "text-purple-600" : "text-gray-500 hover:text-gray-700"}
                    `}
                        >
                            {tab.name}
                            {tab.count !== undefined && (
                                <span className={`
                            px-2 py-0.5 rounded-full text-xs
                            ${activeTab === tab.name ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600"}
                        `}>
                                    {tab.count}
                                </span>
                            )}
                            {activeTab === tab.name && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 py-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="text-gray-600 gap-1 font-normal">
                                <Tag className="w-4 h-4 mr-1" />
                                Tags
                                <MoreVertical className="w-4 h-4 opacity-50 rotate-90" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Campaigns</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="text-gray-600 gap-1 font-normal">
                                <Globe className="w-4 h-4 mr-1" />
                                Global
                                <MoreVertical className="w-4 h-4 opacity-50 rotate-90" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Default</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="text-gray-400">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
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
                                            <p className="text-gray-500">No scheduled posts.</p>
                                            <Button variant="link" onClick={() => setIsCreatePostOpen(true)} className="text-purple-600">Create one?</Button>
                                        </div>
                                    );
                                }

                                const groups: Record<string, typeof queuedPosts> = {};
                                queuedPosts.forEach(post => {
                                    const date = new Date(post.scheduledTime);
                                    const today = new Date();
                                    const tomorrow = new Date(today);
                                    tomorrow.setDate(tomorrow.getDate() + 1);

                                    let key = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

                                    if (date.toDateString() === today.toDateString()) {
                                        key = `Today, ${date.toLocaleDateString([], { month: 'long', day: 'numeric' })}`;
                                    } else if (date.toDateString() === tomorrow.toDateString()) {
                                        key = `Tomorrow, ${date.toLocaleDateString([], { month: 'long', day: 'numeric' })}`;
                                    }

                                    if (!groups[key]) groups[key] = [];
                                    groups[key].push(post);
                                });

                                return Object.entries(groups).map(([dateLabel, posts]) => (
                                    <div key={dateLabel}>
                                        <h4 className="text-gray-900 font-bold mb-4">{dateLabel}</h4>
                                        <div className="space-y-6">
                                            {posts.map((post) => (
                                                <div key={post._id} className="flex gap-6 group">
                                                    {/* Time Column */}
                                                    <div className="w-[80px] text-right flex-shrink-0 pt-2">
                                                        <div className="font-bold text-gray-900 text-sm">
                                                            {new Date(post.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                                                            <Tag className="w-3 h-3 text-gray-400" />
                                                            Custom
                                                        </div>
                                                    </div>

                                                    {/* Large Card */}
                                                    <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                                        <div className="p-3.5 flex gap-4">
                                                            {/* User Avatar */}
                                                            <div className="flex-shrink-0">
                                                                <Avatar className="h-8 w-8 border border-gray-100">
                                                                    <AvatarImage src={connection?.profilePictureUrl || user?.imageUrl} />
                                                                    <AvatarFallback>IG</AvatarFallback>
                                                                </Avatar>
                                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0 flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden w-4 h-4">
                                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" className="w-full h-full object-cover" alt="Instagram" />
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {connection?.username || user?.fullName || "You"}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex gap-4 mt-1.5">
                                                                        {/* Text Content */}
                                                                        <div className="flex-1">
                                                                            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                                                                                {post.content}
                                                                            </p>
                                                                            {post.status === "FAILED" && post.error && (
                                                                                <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2 text-red-600 text-xs font-medium">
                                                                                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                                                    <span>{post.error}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Large Image Preview (Right Side) */}
                                                                        {post.mediaUrl && (
                                                                            <div className="w-[120px] aspect-square bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                                                <img src={post.mediaUrl} alt="Post Media" className="w-full h-full object-cover" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Footer Actions - Always Visible */}
                                                        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span>You created this {formatScheduledDate(post._creationTime)} ago</span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className={`h-8 hover:bg-gray-50 font-medium text-xs border-gray-300 gap-1.5 ${post.status === "FAILED" ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200" : "bg-white text-gray-700"}`}
                                                                    onClick={() => onPublishNow(post._id)}
                                                                >
                                                                    <Zap className="w-3.5 h-3.5" />
                                                                    {post.status === "FAILED" ? "Retry Now" : "Publish Now"}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 bg-white hover:bg-gray-50 border-gray-300 text-gray-600"
                                                                    onClick={() => handleEdit(post)}
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="outline" size="icon" className="h-8 w-8 bg-white hover:bg-gray-50 border-gray-300 text-gray-600">
                                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => onMoveToDraft(post)}>
                                                                            <LayoutList className="w-4 h-4 mr-2" /> Move to Drafts
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleDuplicate(post)}>
                                                                            <Clapperboard className="w-4 h-4 mr-2" /> Duplicate
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleDelete(post._id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
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
                                            <Button variant="link" onClick={() => setIsCreatePostOpen(true)} className="text-purple-600">Create one?</Button>
                                        </div>
                                    );
                                }

                                const groups: Record<string, typeof draftPosts> = {};
                                draftPosts.forEach(post => {
                                    const dateVal = post.scheduledTime || post._creationTime;
                                    const date = new Date(dateVal);
                                    const today = new Date();
                                    const tomorrow = new Date(today);
                                    tomorrow.setDate(tomorrow.getDate() + 1);

                                    let key = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

                                    if (date.toDateString() === today.toDateString()) {
                                        key = `Today, ${date.toLocaleDateString([], { month: 'long', day: 'numeric' })}`;
                                    } else if (date.toDateString() === tomorrow.toDateString()) {
                                        key = `Tomorrow, ${date.toLocaleDateString([], { month: 'long', day: 'numeric' })}`;
                                    }

                                    if (!groups[key]) groups[key] = [];
                                    groups[key].push(post);
                                });

                                return Object.entries(groups).map(([dateLabel, posts]) => (
                                    <div key={dateLabel}>
                                        <h4 className="text-gray-900 font-bold mb-4">{dateLabel}</h4>
                                        <div className="space-y-6">
                                            {posts.map((post) => (
                                                <div key={post._id} className="flex gap-6 group">
                                                    {/* Time & Badges Column */}
                                                    <div className="w-[80px] text-right flex-shrink-0 pt-2 flex flex-col items-end gap-1">
                                                        <div className="font-bold text-gray-900 text-sm">
                                                            {post.scheduledTime ? new Date(post.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "No Time"}
                                                        </div>
                                                        <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full border border-gray-400 border-dashed"></div>
                                                            Tentative
                                                        </div>
                                                        <div className="bg-pink-50 text-pink-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-pink-100 flex items-center gap-1 mt-1">
                                                            <Pencil className="w-2.5 h-2.5" />
                                                            Draft
                                                        </div>
                                                    </div>

                                                    {/* Large Card */}
                                                    <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                                        <div className="p-3.5 flex gap-4">
                                                            {/* User Avatar */}
                                                            <div className="flex-shrink-0">
                                                                <Avatar className="h-8 w-8 border border-gray-100">
                                                                    <AvatarImage src={connection?.profilePictureUrl || user?.imageUrl} />
                                                                    <AvatarFallback>IG</AvatarFallback>
                                                                </Avatar>
                                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0 flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden w-4 h-4">
                                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" className="w-full h-full object-cover" alt="Instagram" />
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {connection?.username || user?.fullName || "You"}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex gap-4 mt-1.5">
                                                                        {/* Text Content */}
                                                                        <div className="flex-1">
                                                                            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                                                                                {post.content || <span className="italic text-gray-400">No content</span>}
                                                                            </p>
                                                                        </div>

                                                                        {/* Large Image Preview (Right Side) */}
                                                                        {post.mediaUrl && (
                                                                            <div className="w-[120px] aspect-square bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                                                <img src={post.mediaUrl} alt="Post Media" className="w-full h-full object-cover" />
                                                                            </div>
                                                                        )}
                                                                        {!post.mediaUrl && (
                                                                            <div className="w-[120px] aspect-square bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center">
                                                                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" className="w-10 h-10 object-contain opacity-20 grayscale" alt="Instagram" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Footer Actions */}
                                                        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span>You created this {formatScheduledDate(post._creationTime)} ago</span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border-gray-300 gap-1.5"
                                                                    onClick={() => onAddToQueue(post)}
                                                                >
                                                                    <LayoutList className="w-3.5 h-3.5" />
                                                                    Add to Queue
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 bg-white hover:bg-gray-50 border-gray-300 text-gray-600"
                                                                    onClick={() => handleEdit(post)}
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="outline" size="icon" className="h-8 w-8 bg-white hover:bg-gray-50 border-gray-300 text-gray-600">
                                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => onPublishNow(post._id)}>
                                                                            <Zap className="w-3.5 h-3.5 mr-2" /> Publish Now
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleDuplicate(post)}>
                                                                            <Clapperboard className="w-3.5 h-3.5 mr-2" /> Duplicate
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleDelete(post._id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                                                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
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

                    {activeTab === "Sent" && (
                        <div className="space-y-8 relative">
                            {(() => {
                                if (!sentPosts || sentPosts.length === 0) {
                                    return (
                                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                            <p className="text-gray-500">No sent posts yet.</p>
                                        </div>
                                    );
                                }

                                const groups: Record<string, typeof sentPosts> = {};
                                sentPosts.forEach(post => {
                                    const date = new Date(post.updatedAt);
                                    const today = new Date();
                                    const yesterday = new Date(today);
                                    yesterday.setDate(yesterday.getDate() - 1);

                                    let key = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

                                    if (date.toDateString() === today.toDateString()) {
                                        key = `Today, ${date.toLocaleDateString([], { month: 'long', day: 'numeric' })}`;
                                    } else if (date.toDateString() === yesterday.toDateString()) {
                                        key = `Yesterday, ${date.toLocaleDateString([], { month: 'long', day: 'numeric' })}`;
                                    }

                                    if (!groups[key]) groups[key] = [];
                                    groups[key].push(post);
                                });

                                return Object.entries(groups).map(([dateLabel, posts]) => (
                                    <div key={dateLabel}>
                                        <h4 className="text-gray-900 font-bold mb-4">{dateLabel}</h4>
                                        <div className="space-y-6">
                                            {posts.map((post) => (
                                                <div key={post._id} className="flex gap-6 group">
                                                    {/* Time & Badges Column */}
                                                    <div className="w-[80px] text-right flex-shrink-0 pt-2 flex flex-col items-end gap-1">
                                                        <div className="font-bold text-gray-900 text-sm">
                                                            {new Date(post.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                    </div>

                                                    {/* Large Card */}
                                                    <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                                        <div className="p-3.5 flex gap-4">
                                                            {/* User Avatar */}
                                                            <div className="flex-shrink-0">
                                                                <Avatar className="h-8 w-8 border border-gray-100">
                                                                    <AvatarImage src={connection?.profilePictureUrl || user?.imageUrl} />
                                                                    <AvatarFallback>IG</AvatarFallback>
                                                                </Avatar>
                                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0 flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden w-4 h-4">
                                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" className="w-full h-full object-cover" alt="Instagram" />
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {connection?.username || user?.fullName || "You"}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex gap-4 mt-1.5">
                                                                        {/* Text Content */}
                                                                        <div className="flex-1">
                                                                            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                                                                                {post.content}
                                                                            </p>
                                                                        </div>

                                                                        {/* Large Image Preview (Right Side) */}
                                                                        {post.mediaUrl && (
                                                                            <div className="w-[120px] aspect-square bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                                                <img src={post.mediaUrl} alt="Post Media" className="w-full h-full object-cover" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Footer Actions */}
                                                        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span>You created this {formatScheduledDate(post._creationTime)} ago</span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {post.platformPostId && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border-gray-300 gap-1.5"
                                                                        onClick={() => window.open(post.platformPostId, '_blank')}
                                                                    >
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                        View Post
                                                                    </Button>
                                                                )}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="outline" size="icon" className="h-8 w-8 bg-white hover:bg-gray-50 border-gray-300 text-gray-600">
                                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleDuplicate(post)}>
                                                                            <Clapperboard className="w-3.5 h-3.5 mr-2" /> Duplicate
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleDelete(post._id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                                                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
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
                </div>
            </div>

            {/* Floating Help Button */}
            <div className="fixed bottom-8 right-8">
                <button className="h-12 w-12 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors">
                    <HelpCircle className="w-6 h-6" />
                </button>
            </div>

            <CreatePostDialog
                open={isCreatePostOpen}
                onOpenChange={(open) => {
                    setIsCreatePostOpen(open);
                    if (!open) {
                        setEditingPost(null);
                    }
                }}
                initialChannel="instagram"
                instagramConnected={isConnected}
                linkedinConnected={false}
                post={editingPost}
                key={editingPost ? editingPost._id : "create-new"}
            />
        </div>
    );
}
