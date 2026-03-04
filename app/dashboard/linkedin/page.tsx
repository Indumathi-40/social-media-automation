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
    Linkedin,
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

export default function LinkedInPage() {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("Queue");
    const [isMounted, setIsMounted] = useState(false);

    const { user, isLoaded } = useUser();
    const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();
    const disconnectMutation = useMutation(api.users.disconnectLinkedin);

    // Derived State from URL
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");
    const code = searchParams.get("code");

    // PHASE 3: Connection UI
    // Use strictly scoped query for connection details
    // We only execute when Clerk is loaded to avoid race conditions.
    const connection = useQuery(api.linkedin.getConnection, isLoaded ? undefined : "skip");

    // Fetch Posts
    const queuedPosts = useQuery(api.linkedin.getPosts, { status: "PENDING" });
    const sentPosts = useQuery(api.linkedin.getPosts, { status: "POSTED" });
    const draftPosts = useQuery(api.linkedin.getPosts, { status: "DRAFT" });

    // Mutations
    const deletePost = useMutation(api.linkedin.deletePost);
    const updatePost = useMutation(api.linkedin.updatePost);
    const performPublish = useAction(api.linkedin.debugPublishPost); // Use the action for immediate publish

    const [editingPost, setEditingPost] = useState<any>(null);

    const handleEdit = (post: any) => {
        setEditingPost(post);
        setIsCreatePostOpen(true);
    };

    const handleDelete = async (postId: any) => {
        if (confirm("Are you sure you want to delete this draft?")) {
            await deletePost({ postId });
        }
    };

    const handleDuplicate = (post: any) => {
        confirm("Duplicate this draft?") && onDuplicate(post);
    };

    // Proper Duplicate Implementation
    const createPost = useMutation(api.linkedin.createPost);
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
        // Shift to PENDING, set time to +1 hour or keep existing if future
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
        // Desired format: "Feb 10, 2:42 PM" or "Today, 2:42 PM"
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

    const isConnected = !!connection;
    const isConnecting = isLoaded && connection === undefined;

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
                            <Avatar className={`h-10 w-10 border border-gray-200 ${isConnecting ? "animate-pulse bg-gray-100" : ""}`}>
                                {connection?.profileImage ? (
                                    <AvatarImage src={connection.profileImage} alt={connection.name} />
                                ) : null}
                                <AvatarFallback>{isConnecting ? "" : (connection?.name?.substring(0, 2).toUpperCase() || "LI")}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                                <Linkedin className="h-3 w-3 text-blue-700 fill-current" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900 leading-none">
                                    {isConnecting ? (
                                        <div className="h-5 w-32 bg-gray-100 animate-pulse rounded" />
                                    ) : (
                                        connection ? connection.name : "Not Connected"
                                    )}
                                </h1>

                                {/* Connect Button if not connected */}
                                {!isConnected && (
                                    <a href="/api/auth/linkedin">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 text-xs"
                                        >
                                            Connect
                                        </Button>
                                    </a>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={async () => {
                                            if (confirm("Are you sure you want to disconnect your LinkedIn account?")) {
                                                try {
                                                    if (user?.id) {
                                                        await disconnectMutation({ clerkId: user.id });
                                                    }
                                                    // Reload to refresh state if needed, though Convex is reactive
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
                                <span className="text-xs font-medium text-emerald-600">1/3 posts sent this week</span>
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
                                Kolkata
                                <MoreVertical className="w-4 h-4 opacity-50 rotate-90" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Kolkata</DropdownMenuItem>
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
                            {/* Grouping Logic (Inline for simplicity) */}
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
                                                                    <AvatarImage src={connection?.profileImage || user?.imageUrl} />
                                                                    <AvatarFallback>U</AvatarFallback>
                                                                </Avatar>
                                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                                                    <Linkedin className="w-3 h-3 text-[#0077b5]" />
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {connection?.name || user?.fullName || "You"}
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
                                                                        {/* Fallback if no media but want to keep spacing? Or just collapse? User ref image shows large image. */}
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
                                                                    className="h-8 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border-gray-300 gap-1.5"
                                                                    onClick={() => onPublishNow(post._id)}
                                                                >
                                                                    <Zap className="w-3.5 h-3.5" />
                                                                    Publish Now
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
                                    // Use scheduledTime if available, else createdAt. 
                                    // Drafts might not have a scheduledTime if just saved as draft without date.
                                    // If no scheduledTime, maybe group under "Unscheduled" or just use Date.now()?
                                    // Reference image shows "Tomorrow, February 10", implying drafts CAN have a scheduled time.
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
                                                        <div className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1 mt-1">
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
                                                                    <AvatarImage src={connection?.profileImage || user?.imageUrl} />
                                                                    <AvatarFallback>U</AvatarFallback>
                                                                </Avatar>
                                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                                                    <Linkedin className="w-3 h-3 text-[#0077b5]" />
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {connection?.name || user?.fullName || "You"}
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
                                                                                <Linkedin className="w-10 h-10 text-gray-300" />
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
                                                                    <AvatarImage src={connection?.profileImage || user?.imageUrl} />
                                                                    <AvatarFallback>U</AvatarFallback>
                                                                </Avatar>
                                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                                                    <Linkedin className="w-3 h-3 text-[#0077b5]" />
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {connection?.name || user?.fullName || "You"}
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
                                                                        onClick={() => window.open(`https://www.linkedin.com/feed/update/${post.platformPostId}`, '_blank')}
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
                initialChannel="linkedin"
                instagramConnected={false}
                linkedinConnected={isConnected}
                post={editingPost}
                key={editingPost ? editingPost._id : "create-new"}
            />
        </div >
    );
}
