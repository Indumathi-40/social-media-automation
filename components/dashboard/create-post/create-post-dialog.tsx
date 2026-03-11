"use client";

import { useState, useEffect, useRef } from "react";
import {
    X,
    Maximize2,
    Wand2,
    Tag,
    Image as ImageIcon,
    Smile,
    Hash,
    ChevronDown,
    Calendar,
    ArrowRight,
    Instagram,
    Linkedin,
    Info,
    Music,
    ShoppingBag,
    Settings,
    Link as LinkIcon,
    Plus,
    Clock,
    Zap,
    MoreHorizontal,
    Trash2,
    MessageSquare,
    Sparkles,
    Check
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { ImageEditorDialog } from "./image-editor-dialog";
import { AltTextDialog } from "./alt-text-dialog";
import { Pencil } from "lucide-react";

interface CreatePostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialChannel?: "instagram" | "linkedin" | "twitter" | "all";
    instagramConnected?: boolean;
    linkedinConnected?: boolean;
    twitterConnected?: boolean;
    post?: any; // Optional post object for editing
}

interface UploadedFile {
    file: File;
    previewUrl: string;
    altText?: string;
}

export function CreatePostDialog({
    open,
    onOpenChange,
    initialChannel = "instagram",
    instagramConnected = false,
    linkedinConnected = false,
    twitterConnected = false,
    post
}: CreatePostDialogProps) {
    const [text, setText] = useState("");
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(true);
    const [showDiscardAlert, setShowDiscardAlert] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Multi-image state
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null);

    // Scheduling state
    const [scheduleType, setScheduleType] = useState<"now" | "next" | "custom">("next");
    const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [editingImage, setEditingImage] = useState(false);
    const [altTextOpen, setAltTextOpen] = useState(false);
    const [createAnother, setCreateAnother] = useState(false);

    // Customization Mode State
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [activeCustomizationChannel, setActiveCustomizationChannel] = useState<string | null>(null);
    const [networkData, setNetworkData] = useState<Record<string, { text: string; uploadedFiles: UploadedFile[] }>>({
        linkedin: { text: "", uploadedFiles: [] },
        instagram: { text: "", uploadedFiles: [] },
        twitter: { text: "", uploadedFiles: [] }
    });

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    // Manual Upload Helper
    const uploadFile = async (file: File) => {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
        });
        const { storageId } = await result.json();
        return storageId;
    };

    const { user } = useUser();

    // Fetch platform connections for profile previews
    const linkedinConnection = useQuery(api.linkedin.getConnection);
    const instagramConnection = useQuery(api.instagram.getConnection);
    const twitterConnection = useQuery(api.twitter.getConnection);

    // Track active platform specific info
    const linkedinProfile = linkedinConnection ? {
        name: linkedinConnection.name,
        image: linkedinConnection.profileImage || linkedinConnection.avatar
    } : {
        name: user?.fullName || "LinkedIn User",
        image: user?.imageUrl
    };

    const instagramProfile = instagramConnection ? {
        name: instagramConnection.username || instagramConnection.name,
        image: instagramConnection.profilePictureUrl
    } : {
        name: user?.username || user?.fullName?.toLowerCase().replace(/\s/g, '_') || "instagram_user",
        image: user?.imageUrl
    };

    const twitterProfile = twitterConnection ? {
        name: twitterConnection.name,
        username: twitterConnection.username,
        image: twitterConnection.profileImageUrl
    } : {
        name: user?.fullName || "Twitter User",
        username: user?.username || user?.fullName?.toLowerCase().replace(/\s/g, '') || "user",
        image: user?.imageUrl
    };

    // Mutations
    const createLinkedInPost = useMutation(api.linkedin.createPost);
    const updateLinkedInPost = useMutation(api.linkedin.updatePost);
    const createTwitterPost = useMutation(api.twitter.createPost);
    const updateTwitterPost = useMutation(api.twitter.updatePost);
    const createInstagramPost = useMutation(api.instagram.createPost);
    const updateInstagramPost = useMutation(api.instagram.updatePost);

    // Initialize state if editing
    useEffect(() => {
        if (post) {
            setText(post.content);

            const existingFiles: any[] = [];

            // Handle explicitly stored mediaUrls (external)
            if (post.mediaUrls && post.mediaUrls.length > 0) {
                post.mediaUrls.forEach((url: string) => {
                    existingFiles.push({
                        file: new File([], "existing_image"),
                        previewUrl: url,
                        isExisting: true
                    });
                });
            }
            // Handle signed URL generated by getPosts (from storageId)
            else if (post.mediaUrl) {
                existingFiles.push({
                    file: new File([], "existing_image"),
                    previewUrl: post.mediaUrl,
                    isExisting: true,
                    storageId: post.mediaStorageIds?.[0] // Store ID reference if available
                });
            }

            if (existingFiles.length > 0) {
                setUploadedFiles(existingFiles);
            }

            if (post.scheduledTime) {
                setCustomDate(new Date(post.scheduledTime));
                setScheduleType("custom");
            }
        }
    }, [post, open]);

    // Update active channel when initialChannel changes or dialog opens
    useEffect(() => {
        if (open) {
            if (initialChannel === "all") {
                setSelectedChannels(["instagram", "linkedin", "twitter"]);
            } else {
                setSelectedChannels([initialChannel]);
            }
        }
    }, [open, initialChannel]);

    const toggleChannel = (channel: string) => {
        if (channel === "instagram" && !instagramConnected) {
            // Logic to show connect dialog could go here
        }

        setSelectedChannels((prev) => {
            if (prev.includes(channel)) {
                return prev.filter((c) => c !== channel);
            } else {
                return [...prev, channel];
            }
        });
    };

    const isSingleInstagram = selectedChannels.length === 1 && selectedChannels.includes("instagram");
    const isSingleLinkedin = selectedChannels.length === 1 && selectedChannels.includes("linkedin");
    const isSingleTwitter = selectedChannels.length === 1 && selectedChannels.includes("twitter");
    const showGenericUI = selectedChannels.length !== 1;

    const handleClose = () => {
        if (text || uploadedFiles.length > 0) {
            setShowDiscardAlert(true);
        } else {
            onOpenChange(false);
        }
    };

    const confirmDiscard = () => {
        setShowDiscardAlert(false);
        onOpenChange(false);
        // Reset state after closing
        setTimeout(() => {
            setText("");
            setUploadedFiles([]);
            setCustomDate(undefined);
            setScheduleType("next");
        }, 300);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                previewUrl: URL.createObjectURL(file)
            }));
            setUploadedFiles(prev => [...prev, ...newFiles]);
        }
        // Reset input value so same file can be selected again if needed
        e.target.value = "";
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].previewUrl);
            newFiles.splice(index, 1);
            return newFiles;
        });
        if (activeFileIndex === index) setActiveFileIndex(null);
    };

    const updateFileBlob = (blob: Blob, index: number) => {
        const file = new File([blob], uploadedFiles[index].file.name, { type: blob.type });
        const newUrl = URL.createObjectURL(file);

        setUploadedFiles(prev => {
            const newFiles = [...prev];
            // Revoke old URL to avoid memory leaks
            URL.revokeObjectURL(newFiles[index].previewUrl);
            newFiles[index] = { ...newFiles[index], file, previewUrl: newUrl };
            return newFiles;
        });
    };

    const updateAltText = (text: string, index: number) => {
        setUploadedFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = { ...newFiles[index], altText: text };
            return newFiles;
        });
    };

    const currentFileToEdit = activeFileIndex !== null ? uploadedFiles[activeFileIndex] : null;

    const handleSubmit = async (isDraft = false) => {
        if (!user?.id || selectedChannels.length === 0) return;
        setIsSubmitting(true);

        try {
            // Determine Scheduled Time (Unified for all channels in this batch)
            let finalScheduledTime = Date.now();
            if (scheduleType === "next") {
                finalScheduledTime = Date.now() + 60 * 60 * 1000;
            } else if (scheduleType === "custom" && customDate) {
                finalScheduledTime = customDate.getTime();
            }
            const status = isDraft ? "DRAFT" : "PENDING";

            // Process each selected channel
            for (const channel of selectedChannels) {
                // Determine content and files for this channel
                const channelText = isCustomizing ? (networkData[channel]?.text || "") : text;
                const channelFiles = isCustomizing ? (networkData[channel]?.uploadedFiles || []) : uploadedFiles;

                if (!channelText && channelFiles.length === 0) continue;

                // 1. Separate Existing and New Files
                const existingFiles = channelFiles.filter((f: any) => f.isExisting && f.storageId);
                const newFiles = channelFiles.filter((f: any) => !f.isExisting);

                // 2. Upload New Files
                const newStorageIds = await Promise.all(newFiles.map(f => uploadFile(f.file)));

                // 3. Combine IDs
                const finalStorageIds = [...existingFiles.map((f: any) => f.storageId), ...newStorageIds];

                // 4. Create/Update Post for specific channel
                if (channel === 'linkedin') {
                    if (post) {
                        await updateLinkedInPost({ postId: post._id, content: channelText, scheduledTime: finalScheduledTime, mediaStorageIds: finalStorageIds, status: status });
                    } else {
                        await createLinkedInPost({ content: channelText, scheduledTime: finalScheduledTime, mediaStorageIds: finalStorageIds, mediaUrls: [], status: status });
                    }
                } else if (channel === 'twitter') {
                    if (post) {
                        await updateTwitterPost({ postId: post._id, content: channelText, scheduledTime: finalScheduledTime, mediaStorageIds: finalStorageIds, status: status });
                    } else {
                        await createTwitterPost({ content: channelText, scheduledTime: finalScheduledTime, mediaStorageIds: finalStorageIds, mediaUrls: [], status: status });
                    }
                } else if (channel === 'instagram') {
                    if (post) {
                        await updateInstagramPost({ postId: post._id, content: channelText, scheduledTime: finalScheduledTime, mediaStorageIds: finalStorageIds, status: status });
                    } else {
                        await createInstagramPost({ content: channelText, scheduledTime: finalScheduledTime, mediaStorageIds: finalStorageIds, mediaUrls: [], status: status });
                    }
                }
            }

            onOpenChange(false);
            setTimeout(() => {
                setText("");
                setUploadedFiles([]);
                setCustomDate(undefined);
                setIsCustomizing(false);
                setNetworkData({
                    linkedin: { text: "", uploadedFiles: [] },
                    instagram: { text: "", uploadedFiles: [] },
                    twitter: { text: "", uploadedFiles: [] }
                });
            }, 300);
        } catch (e) {
            console.error("Failed to save posts:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getScheduleButtonLabel = () => {
        if (isSubmitting) return "Scheduling...";
        if (scheduleType === "now") return "Post Now";
        if (scheduleType === "next") return "Schedule for Next Available";
        if (scheduleType === "custom" && customDate) return `Schedule for ${customDate.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`;
        return post ? "Update Post" : "Schedule Post";
    };

    return (
        <>
            <AlertDialog open={showDiscardAlert} onOpenChange={setShowDiscardAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You'll permanently lose any changes you've made
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDiscardAlert(false)}>Keep Editing</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDiscard}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[1100px] p-0 gap-0 overflow-hidden h-[85vh] flex flex-col sm:max-h-[800px] bg-gray-50/50 [&>button]:hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
                        <div className="flex items-center gap-4">
                            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                {post ? "Edit Post" : "Create Post"}
                            </DialogTitle>
                            <Button variant="outline" size="sm" className="h-8 gap-2 text-gray-600 border-gray-200 bg-white hover:bg-gray-50">
                                <Tag className="w-3.5 h-3.5" />
                                Tags
                                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 gap-2 text-gray-600 hover:text-purple-600 font-medium hidden sm:flex">
                                <Wand2 className="w-3.5 h-3.5" />
                                AI Assistant
                            </Button>
                            <Button
                                variant={showPreview ? "default" : "secondary"}
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                                className={`h-8 gap-2 font-medium transition-all hidden lg:flex ${showPreview
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                                Preview
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-transparent" onClick={handleClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {activeFileIndex !== null && currentFileToEdit && (
                            <>
                                <ImageEditorDialog
                                    open={editingImage}
                                    onOpenChange={(open) => {
                                        setEditingImage(open);
                                        if (!open) setActiveFileIndex(null);
                                    }}
                                    imageSrc={currentFileToEdit.previewUrl}
                                    onSave={(blob) => {
                                        if (activeFileIndex !== null) updateFileBlob(blob, activeFileIndex);
                                    }}
                                />
                                <AltTextDialog
                                    open={altTextOpen}
                                    onOpenChange={(open) => {
                                        setAltTextOpen(open);
                                        if (!open) setActiveFileIndex(null);
                                    }}
                                    initialText={currentFileToEdit.altText || ""}
                                    onSave={(text) => {
                                        if (activeFileIndex !== null) updateAltText(text, activeFileIndex);
                                    }}
                                />
                            </>
                        )}

                        {/* Left Pane - Editor */}
                        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white">
                            <div className="p-6 space-y-6">
                                {/* Channel Selector (Only show if not customizing) */}
                                {!isCustomizing && (
                                    <div className="flex flex-wrap items-center gap-3 mb-6">
                                        {/* Linkedin */}
                                        <div
                                            className={`relative group cursor-pointer transition-all duration-200 ${selectedChannels.includes('linkedin') ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-100 scale-95 hover:scale-100'}`}
                                            onClick={() => toggleChannel('linkedin')}
                                        >
                                            {selectedChannels.includes('linkedin') && (
                                                <div className="absolute inset-0 rounded-full border-2 border-blue-600 scale-110"></div>
                                            )}
                                            <Avatar className="h-10 w-10 border-2 border-white relative z-10 shadow-sm">
                                                <AvatarImage src={linkedinProfile.image} />
                                                <AvatarFallback>LI</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 z-20 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                                                <Linkedin className="h-3 w-3 text-[#0077b5] fill-current" />
                                            </div>
                                        </div>
                                        {/* Instagram */}
                                        <div
                                            className={`relative group cursor-pointer transition-all duration-200 ${selectedChannels.includes('instagram') ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-100 scale-95 hover:scale-100'}`}
                                            onClick={() => toggleChannel('instagram')}
                                        >
                                            {selectedChannels.includes('instagram') && (
                                                <div className="absolute inset-0 rounded-full border-2 border-pink-500 scale-110"></div>
                                            )}
                                            <Avatar className="h-10 w-10 border-2 border-white relative z-10 shadow-sm">
                                                <AvatarImage src={instagramProfile.image} />
                                                <AvatarFallback>IN</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 z-20 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                                                <Instagram className="h-3 w-3 text-[#E1306C]" />
                                            </div>
                                        </div>
                                        {/* Twitter */}
                                        <div
                                            className={`relative group cursor-pointer transition-all duration-200 ${selectedChannels.includes('twitter') ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-100 scale-95 hover:scale-100'}`}
                                            onClick={() => toggleChannel('twitter')}
                                        >
                                            {selectedChannels.includes('twitter') && (
                                                <div className="absolute inset-0 rounded-full border-2 border-black scale-110"></div>
                                            )}
                                            <Avatar className="h-10 w-10 border-2 border-white relative z-10 shadow-sm">
                                                <AvatarImage src={twitterProfile.image} />
                                                <AvatarFallback>TW</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 z-20 bg-black rounded-full p-1 shadow-sm border border-gray-100 flex items-center justify-center w-4 h-4">
                                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-2.5 w-2.5 fill-white">
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedChannels.length > 1 && isCustomizing && (
                                    <div className="flex items-center gap-3 mb-6 px-1">
                                        {selectedChannels.map((channel) => {
                                            const profile = channel === 'linkedin' ? linkedinProfile : channel === 'instagram' ? instagramProfile : twitterProfile;
                                            const isActive = activeCustomizationChannel === channel;
                                            return (
                                                <div
                                                    key={channel}
                                                    onClick={() => setActiveCustomizationChannel(channel)}
                                                    className={`relative cursor-pointer transition-all duration-200 ${isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                                                >
                                                    <Avatar className={`h-10 w-10 border-2 ${isActive ? 'border-purple-500 shadow-md transform' : 'border-white'}`}>
                                                        <AvatarImage src={profile.image} />
                                                        <AvatarFallback>{channel[0].toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 shadow-sm border border-white ${channel === 'twitter' ? 'bg-black' : 'bg-white'}`}>
                                                        {channel === 'linkedin' && <Linkedin className="w-3 h-3 text-[#0077b5] fill-current" />}
                                                        {channel === 'instagram' && <Instagram className="w-3 h-3 text-[#E1306C]" />}
                                                        {channel === 'twitter' && <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {isCustomizing ? (
                                        // Multiple Editors
                                        // Multiple Stacked Editors
                                        selectedChannels.map((channel) => {
                                            const isActive = activeCustomizationChannel === channel;
                                            const channelText = networkData[channel]?.text || "";
                                            const channelFiles = networkData[channel]?.uploadedFiles || [];

                                            return (
                                                <div
                                                    key={channel}
                                                    onClick={() => !isActive && setActiveCustomizationChannel(channel)}
                                                    className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isActive
                                                        ? 'border-purple-400 shadow-lg ring-1 ring-purple-400/20 mb-4'
                                                        : 'border-gray-100 hover:border-gray-200 cursor-pointer mb-2 bg-gray-50/30'
                                                        }`}
                                                >
                                                    {/* Collapsed View */}
                                                    {!isActive && (
                                                        <div className="px-4 py-3 flex items-center justify-between group">
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                <div className="flex-shrink-0">
                                                                    {channel === 'linkedin' && <div className="bg-[#0077b5] rounded-sm p-0.5"><Linkedin className="w-3.5 h-3.5 text-white fill-current" /></div>}
                                                                    {channel === 'instagram' && <Instagram className="w-4 h-4 text-[#E1306C]" />}
                                                                    {channel === 'twitter' && <div className="w-4 h-4 bg-black rounded-full p-0.5 flex items-center justify-center"><svg viewBox="0 0 24 24" className="fill-white w-full h-full"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg></div>}
                                                                </div>
                                                                <p className="text-sm text-gray-400 truncate font-medium italic">
                                                                    {channelText || `Custom content for ${channel}...`}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {channelFiles.length > 0 && (
                                                                    <div className="w-8 h-8 rounded border border-gray-100 overflow-hidden flex-shrink-0">
                                                                        <img src={channelFiles[0].previewUrl} alt="Snippet" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                                                    </div>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 opacity-0 group-hover:opacity-100">
                                                                    <Pencil className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Expanded Editor */}
                                                    {isActive && (
                                                        <>
                                                            <div className="px-4 py-2 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    {channel === 'linkedin' && <Linkedin className="w-4 h-4 text-[#0077b5] fill-current" />}
                                                                    {channel === 'instagram' && <Instagram className="w-4 h-4 text-[#E1306C]" />}
                                                                    {channel === 'twitter' && <div className="w-4 h-4 bg-black rounded-full p-0.5 flex items-center justify-center"><svg viewBox="0 0 24 24" className="fill-white w-full h-full"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg></div>}
                                                                    <span className="text-xs font-bold text-gray-700 capitalize">{channel} Content</span>
                                                                </div>
                                                                <div className="bg-purple-600 text-[9px] text-white font-bold px-1.5 py-0.5 rounded tracking-tighter">EDITING</div>
                                                            </div>
                                                            <div className="p-4 space-y-4">
                                                                <div className="min-h-[150px]">
                                                                    <Textarea
                                                                        value={channelText}
                                                                        autoFocus
                                                                        onChange={(e) => {
                                                                            setNetworkData(prev => ({
                                                                                ...prev,
                                                                                [channel]: { ...prev[channel], text: e.target.value }
                                                                            }));
                                                                        }}
                                                                        placeholder={`What would you like to share on ${channel}?`}
                                                                        className="flex-1 resize-none border-none shadow-none text-base p-0 focus-visible:ring-0 placeholder:text-gray-300 min-h-[100px]"
                                                                    />

                                                                    {channelFiles.length > 0 ? (
                                                                        <div className="mt-4 flex gap-3">
                                                                            {channelFiles.map((f, i) => (
                                                                                <div key={i} className="relative group w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                                                    <img src={f.previewUrl} className="w-full h-full object-cover" />
                                                                                    <Button
                                                                                        variant="destructive"
                                                                                        size="icon"
                                                                                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setNetworkData(prev => ({
                                                                                                ...prev,
                                                                                                [channel]: { ...prev[channel], uploadedFiles: prev[channel].uploadedFiles.filter((_, idx) => idx !== i) }
                                                                                            }));
                                                                                        }}
                                                                                    >
                                                                                        <X className="w-3 h-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            ))}
                                                                            <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                                                                <Plus className="w-4 h-4 text-gray-400" />
                                                                                <input
                                                                                    type="file"
                                                                                    multiple
                                                                                    className="hidden"
                                                                                    onChange={(e) => {
                                                                                        const files = Array.from(e.target.files || []);
                                                                                        const newUnits = files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f), isExisting: false }));
                                                                                        setNetworkData(prev => ({
                                                                                            ...prev,
                                                                                            [channel]: { ...prev[channel], uploadedFiles: [...prev[channel].uploadedFiles, ...newUnits] }
                                                                                        }));
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="mt-4">
                                                                            <label className="border-[1.5px] border-dashed border-gray-300 rounded-lg w-[200px] h-[80px] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-all group overflow-hidden">
                                                                                <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mb-1 group-hover:bg-blue-50 transition-colors">
                                                                                    <ImageIcon className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                                                                                </div>
                                                                                <p className="text-[9px] font-medium text-gray-500 leading-tight">
                                                                                    Drag & drop or <span className="text-blue-600">select files</span>
                                                                                </p>
                                                                                <input
                                                                                    type="file"
                                                                                    multiple
                                                                                    className="hidden"
                                                                                    onChange={(e) => {
                                                                                        const files = Array.from(e.target.files || []);
                                                                                        const newUnits = files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f), isExisting: false }));
                                                                                        setNetworkData(prev => ({
                                                                                            ...prev,
                                                                                            [channel]: { ...prev[channel], uploadedFiles: [...prev[channel].uploadedFiles, ...newUnits] }
                                                                                        }));
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50">
                                                                            <Smile className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                                                            <Hash className="w-4 h-4" />
                                                                        </Button>
                                                                        <div className="flex items-center gap-1">
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-600 hover:bg-purple-50">
                                                                                <Sparkles className="w-4 h-4" />
                                                                            </Button>
                                                                            <ChevronDown className="w-3.5 h-3.5 text-gray-300 -ml-1" />
                                                                        </div>
                                                                        {channel === 'twitter' && (
                                                                            <div className="flex items-center gap-1 ml-4 py-1 px-2 hover:bg-gray-100 rounded transition-colors cursor-pointer group">
                                                                                <Plus className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                                                                                <span className="text-xs font-bold text-blue-600">Start Thread</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${channel === 'twitter' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                                            {channelText.length} / {channel === 'twitter' ? '280' : '3000'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        // Standard Single Editor
                                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                                            <div className="min-h-[300px] flex flex-col relative">
                                                <div className="flex gap-4">
                                                    {isSingleLinkedin && <div className="flex-shrink-0 pt-1"><div className="bg-[#0077b5] rounded-sm p-0.5"><Linkedin className="w-5 h-5 text-white fill-current" /></div></div>}
                                                    {isSingleInstagram && <div className="flex-shrink-0 pt-1"><Instagram className="w-5 h-5 text-[#E1306C]" /></div>}
                                                    {isSingleTwitter && <div className="flex-shrink-0 pt-1"><div className="w-5 h-5 bg-black rounded-full p-1 flex items-center justify-center"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg></div></div>}

                                                    <div className="flex-1 flex flex-col gap-3">
                                                        <Textarea
                                                            value={text}
                                                            onChange={(e) => setText(e.target.value)}
                                                            placeholder="What would you like to share?"
                                                            className="flex-1 resize-none border-none shadow-none text-lg p-0 focus-visible:ring-0 placeholder:text-gray-300 min-h-[120px]"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-6">
                                                    {uploadedFiles.length > 0 ? (
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            {uploadedFiles.map((file, index) => (
                                                                <div key={index} className="relative group w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                                    {file.file.type.startsWith('video') ? (
                                                                        <div className="w-full h-full flex items-center justify-center bg-black">
                                                                            <span className="text-white text-xs">Video</span>
                                                                        </div>
                                                                    ) : (
                                                                        <img src={file.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                                    )}

                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                                                        <div className="flex gap-2 justify-end">
                                                                            {!file.file.type.startsWith('video') && (
                                                                                <>
                                                                                    <Button
                                                                                        variant="secondary"
                                                                                        size="icon"
                                                                                        className="h-7 w-7 rounded-full bg-white hover:bg-gray-100"
                                                                                        onClick={() => {
                                                                                            setActiveFileIndex(index);
                                                                                            setEditingImage(true);
                                                                                        }}
                                                                                    >
                                                                                        <Pencil className="w-3.5 h-3.5 text-gray-700" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="secondary"
                                                                                        size="icon"
                                                                                        className="h-7 w-7 rounded-full bg-white hover:bg-gray-100 relative"
                                                                                        onClick={() => {
                                                                                            setActiveFileIndex(index);
                                                                                            setAltTextOpen(true);
                                                                                        }}
                                                                                    >
                                                                                        <span className="text-[9px] font-bold text-gray-700">ALT</span>
                                                                                        {file.altText && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>}
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                            <Button
                                                                                variant="secondary"
                                                                                size="icon"
                                                                                className="h-7 w-7 rounded-full bg-white hover:bg-red-50 text-red-600"
                                                                                onClick={() => removeFile(index)}
                                                                            >
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="aspect-square flex items-center justify-center">
                                                                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-all">
                                                                    <Plus className="w-6 h-6 text-gray-400" />
                                                                    <span className="text-xs text-gray-500 mt-2">Add More</span>
                                                                    <input
                                                                        type="file"
                                                                        multiple
                                                                        accept="image/*,video/*"
                                                                        className="hidden"
                                                                        onChange={handleFileUpload}
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <label
                                                            htmlFor="file-upload"
                                                            className="border-[1.5px] border-dashed border-gray-300 rounded-lg w-full max-w-[300px] h-[100px] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all group relative"
                                                        >
                                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                                <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                            </div>
                                                            <p className="text-[10px] font-medium text-gray-500 leading-tight">
                                                                Drag & drop or <span className="text-blue-600">select files</span>
                                                            </p>
                                                        </label>
                                                    )}
                                                    <input
                                                        id="file-upload"
                                                        type="file"
                                                        multiple
                                                        accept="image/*,video/*"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-1">
                                                    <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50">
                                                                <Smile className="w-4 h-4" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 border-none shadow-xl" align="start">
                                                            <EmojiPicker
                                                                onEmojiClick={(emojiData: EmojiClickData) => {
                                                                    setText(prev => prev + emojiData.emoji);
                                                                    setEmojiPickerOpen(false);
                                                                }}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                                        <Hash className="w-4 h-4" />
                                                    </Button>
                                                    <div className="flex items-center gap-1 px-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-600 hover:bg-purple-50">
                                                            <Sparkles className="w-4 h-4" />
                                                        </Button>
                                                        <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${isSingleTwitter ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                        {text.length} / {isSingleTwitter ? "280" : "3000"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>



                        {/* Right Pane - Preview */}
                        {showPreview && (
                            <div className="w-[440px] bg-gray-50 p-0 flex flex-col hidden lg:flex border-l border-gray-200">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        Post Previews <Info className="w-3.5 h-3.5 text-gray-400" />
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {((!isCustomizing && uploadedFiles.length === 0) || (isCustomizing && selectedChannels.every(c => (networkData[c]?.uploadedFiles?.length || 0) === 0))) && (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
                                            <div className="relative">
                                                <div className="w-32 h-44 bg-gray-100 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                                    <div className="p-3 border-b border-gray-200 flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded-full bg-gray-200" />
                                                        <div className="w-12 h-2 bg-gray-200 rounded" />
                                                    </div>
                                                    <div className="p-3 space-y-2">
                                                        <div className="w-full h-16 bg-gray-50 rounded-lg border border-dashed border-gray-200" />
                                                        <div className="w-full h-2 bg-gray-200 rounded" />
                                                        <div className="w-2/3 h-2 bg-gray-200 rounded" />
                                                    </div>
                                                </div>
                                                <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-pulse" />
                                                <Sparkles className="absolute -bottom-2 -left-4 w-5 h-5 text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-medium text-sm">See your post's preview here</p>
                                        </div>
                                    )}

                                    {/* LinkedIn Preview */}
                                    {selectedChannels.includes('linkedin') && (!isCustomizing || activeCustomizationChannel === 'linkedin') && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                                                <Linkedin className="w-3.5 h-3.5 fill-current" /> LinkedIn
                                            </div>
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Avatar className="w-10 h-10 border border-gray-100">
                                                            <AvatarImage src={linkedinProfile.image} />
                                                            <AvatarFallback>U</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 leading-none mb-1">{linkedinProfile.name}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                                1h • <GlobeIcon className="w-2.5 h-2.5" />
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="whitespace-pre-wrap text-sm text-gray-800 mb-4 font-normal leading-relaxed">
                                                        {(isCustomizing ? networkData.linkedin?.text : text) || <span className="text-gray-300 italic">What would you like to share?</span>}
                                                    </div>
                                                    {(isCustomizing ? networkData.linkedin?.uploadedFiles : uploadedFiles).length > 0 && (
                                                        <div className={`grid gap-0.5 rounded-lg overflow-hidden border border-gray-100 ${(isCustomizing ? networkData.linkedin?.uploadedFiles : uploadedFiles).length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                            {(isCustomizing ? networkData.linkedin?.uploadedFiles : uploadedFiles).map((f, i) => (
                                                                <div key={i} className={`relative aspect-square bg-gray-50 ${(isCustomizing ? networkData.linkedin?.uploadedFiles : uploadedFiles).length === 3 && i === 0 ? 'row-span-2' : ''}`}>
                                                                    <img src={f.previewUrl} className="w-full h-full object-cover" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                                                    <div className="flex items-center gap-1">
                                                        <Avatar className="w-5 h-5 border border-white">
                                                            <AvatarImage src={linkedinProfile.image} />
                                                        </Avatar>
                                                        <ChevronDown className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                                                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                                                            <span className="text-[9px] font-bold">Like</span>
                                                        </button>
                                                        <button className="flex flex-col items-center gap-1 text-gray-500">
                                                            <MessageSquare className="w-4 h-4" />
                                                            <span className="text-[9px] font-bold">Comment</span>
                                                        </button>
                                                        <button className="flex flex-col items-center gap-1 text-gray-500">
                                                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M17 1l4 4-4 4m-3.5 0l4 4-4 4" /><path d="M21 5H9a4 4 0 0 0-4 4v10" /><path d="M3 13l-4 4 4 4" /><path d="M0 17h12a4 4 0 0 0 4-4V3" /></svg>
                                                            <span className="text-[9px] font-bold">Repost</span>
                                                        </button>
                                                        <button className="flex flex-col items-center gap-1 text-gray-500">
                                                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                                            <span className="text-[9px] font-bold">Send</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Instagram Preview */}
                                    {selectedChannels.includes('instagram') && (!isCustomizing || activeCustomizationChannel === 'instagram') && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                                                <Instagram className="w-3.5 h-3.5" /> Instagram
                                            </div>
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8 p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                                                            <AvatarImage src={instagramProfile.image} className="rounded-full border-2 border-white" />
                                                        </Avatar>
                                                        <p className="text-xs font-bold text-gray-900">{instagramProfile.name}</p>
                                                    </div>
                                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                </div>

                                                <div className="aspect-square bg-gray-50 overflow-hidden flex items-center justify-center">
                                                    {(isCustomizing ? networkData.instagram?.uploadedFiles : uploadedFiles).length > 0 ? (
                                                        <img src={(isCustomizing ? networkData.instagram?.uploadedFiles : uploadedFiles)[0].previewUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                                            <Instagram className="w-12 h-12" />
                                                            <span className="text-[10px] font-bold">Post Preview</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-3">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-4">
                                                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-2"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                                        </div>
                                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                                    </div>
                                                    <p className="text-xs font-bold mb-1">100 likes</p>
                                                    <div className="text-xs">
                                                        <span className="font-bold mr-2">{instagramProfile.name}</span>
                                                        <span className="text-gray-800 font-normal leading-relaxed">{(isCustomizing ? networkData.instagram?.text : text) || "Your caption will appear here..."}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Twitter / X Preview */}
                                    {selectedChannels.includes('twitter') && (!isCustomizing || activeCustomizationChannel === 'twitter') && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg> Twitter / X
                                            </div>
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                                <div className="flex gap-3">
                                                    <Avatar className="w-10 h-10 border border-gray-100 flex-shrink-0">
                                                        <AvatarImage src={twitterProfile.image} />
                                                        <AvatarFallback>U</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <div className="flex items-center gap-1 min-w-0">
                                                                <span className="text-sm font-bold text-gray-900 truncate">
                                                                    {twitterProfile.name}
                                                                </span>
                                                                <span className="text-gray-500 text-sm truncate">
                                                                    @{twitterProfile.username}
                                                                </span>
                                                                <span className="text-gray-500 text-sm">· 1m</span>
                                                            </div>
                                                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <div className="text-sm text-gray-800 mb-3 whitespace-pre-wrap font-normal leading-normal">
                                                            {(isCustomizing ? networkData.twitter?.text : text) || <span className="text-gray-300 italic">Thinking about what to tweet...</span>}
                                                        </div>
                                                        {uploadedFiles.length > 0 && (
                                                            <div className={`rounded-xl overflow-hidden border border-gray-200 aspect-video mb-3 bg-gray-50`}>
                                                                <img src={uploadedFiles[0].previewUrl} className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between max-w-[320px] pt-1">
                                                            <button className="flex items-center gap-1.5 text-gray-500 group"><MessageSquare className="w-4 h-4" /><span className="text-[11px]">0</span></button>
                                                            <button className="flex items-center gap-1.5 text-gray-500 group"><svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M17 1l4 4-4 4m-3.5 0l4 4-4 4" /><path d="M21 5H9a4 4 0 0 0-4 4v10" /><path d="M3 13l-4 4 4 4" /><path d="M0 17h12a4 4 0 0 0 4-4V3" /></svg><span className="text-[11px]">0</span></button>
                                                            <button className="flex items-center gap-1.5 text-gray-500 group"><svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg><span className="text-[11px]">0</span></button>
                                                            <button className="flex items-center gap-1.5 text-gray-500 group"><svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg><span className="text-[11px]">0</span></button>
                                                            <button className="flex items-center gap-1.5 text-gray-500 group"><svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between z-10 px-6 gap-4 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${createAnother ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                    {createAnother && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={createAnother}
                                    onChange={(e) => setCreateAnother(e.target.checked)}
                                />
                                <span className="text-sm font-medium text-gray-600">Create Another</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            {selectedChannels.length > 1 && !isCustomizing ? (
                                <Button
                                    onClick={() => {
                                        setIsCustomizing(true);
                                        setActiveCustomizationChannel(selectedChannels[0]);
                                        // Initialize network data with current shared content
                                        const initialData: any = {};
                                        selectedChannels.forEach(channel => {
                                            initialData[channel] = { text, uploadedFiles };
                                        });
                                        setNetworkData(initialData);
                                    }}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-6 shadow-sm gap-2"
                                >
                                    Customize for each network
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <div className="flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200 w-full sm:w-auto overflow-x-auto whitespace-nowrap">
                                    <input
                                        ref={dateInputRef}
                                        type="datetime-local"
                                        className="absolute opacity-0 w-0 h-0 p-0 m-0 border-0 overflow-hidden pointer-events-none"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setCustomDate(new Date(e.target.value));
                                                setScheduleType("custom");
                                            }
                                        }}
                                    />

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white rounded-md transition-all">
                                                {scheduleType === "now" && <Zap className="w-3.5 h-3.5 text-orange-500" />}
                                                {scheduleType === "next" && <Calendar className="w-3.5 h-3.5 text-blue-500" />}
                                                {scheduleType === "custom" && <Clock className="w-3.5 h-3.5 text-purple-500" />}
                                                <span>
                                                    {scheduleType === "now" ? "Total Priority (Post Now)" :
                                                        scheduleType === "next" ? "Next Available Slot" :
                                                            customDate ? customDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Pick Date & Time"}
                                                </span>
                                                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[300px]">
                                            <DropdownMenuItem className="gap-3 p-3 cursor-pointer" onClick={() => setScheduleType("next")}>
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">Next Available</span>
                                                    <span className="text-xs text-gray-500">Add to the end of your queue</span>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="gap-3 p-3 cursor-pointer" onClick={() => setScheduleType("now")}>
                                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                                    <Zap className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">Prioritize (Post Now)</span>
                                                    <span className="text-xs text-gray-500">Publish immediately to selected channels</span>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="gap-3 p-3 cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}>
                                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">Set Date and Time</span>
                                                    <span className="text-xs text-gray-500">Choose a specific time to post</span>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <div className="w-px h-5 bg-gray-200 mx-1" />

                                    <button
                                        className="px-4 py-1.5 text-xs font-bold text-blue-600 hover:bg-white rounded-md transition-all disabled:opacity-50"
                                        disabled={isSubmitting || (isSingleLinkedin && !linkedinConnected) || (isSingleTwitter && !twitterConnected) || (isSingleInstagram && !instagramConnected)}
                                        onClick={() => handleSubmit(false)}
                                    >
                                        {isSubmitting ? "Scheduling..." : "Schedule Post"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog >
        </>
    );
}

function GlobeIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}
