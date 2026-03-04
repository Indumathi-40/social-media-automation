import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";

// --- Mutations ---

// --- Mutations ---

export const registerConnection = mutation({
    args: {
        // clerkId removed - we use authenticated identity
        linkedinMemberId: v.string(),
        accessToken: v.string(),
        expiresIn: v.number(),
        refreshToken: v.optional(v.string()),
        refreshTokenExpiresIn: v.optional(v.number()),
        name: v.string(),
        email: v.optional(v.string()),
        avatar: v.optional(v.string()),
        profileImage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // STRICT SECURITY: Use the authenticated user identity
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized: No identity found for registerConnection");
        }
        const userId = identity.subject;

        // 1. Check if connection exists for THIS specific user
        const existingcnx = await ctx.db
            .query("linkedin_connections")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        // 2. SOCIAL MEDIA ISOLATION: Check if this LinkedIn account is ALREADY linked to a DIFFERENT user
        const occupiedConnection = await ctx.db
            .query("linkedin_connections")
            .withIndex("by_linkedinMemberId", (q) => q.eq("linkedinMemberId", args.linkedinMemberId))
            .first();

        if (occupiedConnection && occupiedConnection.userId !== userId) {
            throw new Error("This LinkedIn account is already connected to another user. Please log out of LinkedIn in your browser and try again.");
        }

        const data = {
            userId: userId, // PRIMARY KEY for tenancy
            linkedinMemberId: args.linkedinMemberId,
            accessToken: args.accessToken,
            expiresIn: args.expiresIn,
            refreshToken: args.refreshToken,
            refreshTokenExpiresIn: args.refreshTokenExpiresIn,
            name: args.name,
            email: args.email,
            avatar: args.avatar,
            profileImage: args.profileImage || args.avatar,
            updatedAt: Date.now(),
        };

        if (existingcnx) {
            await ctx.db.patch(existingcnx._id, data);
        } else {
            await ctx.db.insert("linkedin_connections", data);
        }

        // 3. Sync to Users Table (Centralized Source of Truth)
        const userRecord = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
            .first();

        if (userRecord) {
            await ctx.db.patch(userRecord._id, {
                linkedinConnectionId: args.linkedinMemberId, // Keeping for legacy/reference
                linkedinUsername: args.name, // Best approximation if username not available
                linkedinAvatar: args.avatar,
                linkedinConnected: true,
                linkedinLastConnectedAt: Date.now(),
                linkedinProfile: {
                    id: args.linkedinMemberId,
                    username: undefined, // LinkedIn often doesn't give a "handle" in the basic profile
                    name: args.name,
                    imageUrl: args.avatar,
                    email: args.email,
                },
                updatedAt: Date.now(),
            });
        }
    },
});

// --- Queries ---

export const getConnection = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const userId = identity.subject;

        return await ctx.db
            .query("linkedin_connections")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();
    },
});

export const getPosts = query({
    args: { status: v.string() }, // "PENDING" or "POSTED"
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const userId = identity.subject;

        const posts = await ctx.db
            .query("posts")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("platform"), "linkedin"))
            .filter((q) => q.eq(q.field("status"), args.status))
            .order("desc")
            .collect();

        // Enrich with media URLs
        return await Promise.all(posts.map(async (post) => {
            let mediaUrl = null;
            if (post.mediaStorageIds && post.mediaStorageIds.length > 0) {
                mediaUrl = await ctx.storage.getUrl(post.mediaStorageIds[0]);
            }
            return { ...post, mediaUrl };
        }));
    },
});



// --- Posts & Scheduling ---

export const createPost = mutation({
    args: {
        content: v.string(),
        scheduledTime: v.number(),
        mediaUrls: v.optional(v.array(v.string())),
        mediaStorageIds: v.optional(v.array(v.string())),
        firstComment: v.optional(v.string()), // Deprecated but kept for schema compatibility if needed, or remove if fully reverted. User reverted it.
        status: v.optional(v.string()), // "PENDING" | "DRAFT" | "POSTED" | "FAILED"
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.subject;

        await ctx.db.insert("posts", {
            userId: userId,
            platform: "linkedin",
            content: args.content,
            mediaUrls: args.mediaUrls,
            mediaStorageIds: args.mediaStorageIds,
            // firstComment: args.firstComment, // Removed
            scheduledTime: args.scheduledTime,
            status: args.status || "PENDING",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const updatePost = mutation({
    args: {
        postId: v.id("posts"),
        content: v.optional(v.string()),
        mediaStorageIds: v.optional(v.array(v.string())),
        scheduledTime: v.optional(v.number()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.subject;

        const post = await ctx.db.get(args.postId);
        if (!post || post.userId !== userId) throw new Error("Post not found or unauthorized");

        const updates: any = { updatedAt: Date.now() };
        if (args.content !== undefined) updates.content = args.content;
        if (args.mediaStorageIds !== undefined) updates.mediaStorageIds = args.mediaStorageIds;
        if (args.scheduledTime !== undefined) updates.scheduledTime = args.scheduledTime;
        if (args.status !== undefined) updates.status = args.status;

        await ctx.db.patch(args.postId, updates);
    },
});

export const deletePost = mutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.subject;

        const post = await ctx.db.get(args.postId);
        if (!post || post.userId !== userId) throw new Error("Post not found or unauthorized");

        await ctx.db.delete(args.postId);
    }
});

export const updatePostStatus = internalMutation({
    args: {
        postId: v.id("posts"),
        status: v.string(),
        platformPostId: v.optional(v.string()),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.postId, {
            status: args.status,
            platformPostId: args.platformPostId,
            error: args.error,
            updatedAt: Date.now(),
        });
    },
});

export const getConnectionInternal = internalQuery({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("linkedin_connections")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const getPendingPosts = internalQuery({
    handler: async (ctx) => {
        const now = Date.now();
        // Return posts that are PENDING and confirmed to be roughly ready.
        // Complex index required: .index("by_status_scheduledTime", ["status", "scheduledTime"])
        return await ctx.db
            .query("posts")
            .withIndex("by_status_scheduledTime", (q) =>
                q.eq("status", "PENDING").lte("scheduledTime", now)
            )
            .collect();
    }
});

export const getPost = internalQuery({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.postId);
    }
});

export const getAllPosts = internalQuery({
    handler: async (ctx) => {
        const posts = await ctx.db.query("posts").collect();
        return posts.map(p => `${p._id} ${p.status}`);
    }
});

// --- Actions (Cron Job Target) ---

// --- Actions (Cron Job Target) ---

export const publishPendingPosts = internalAction({
    handler: async (ctx) => {
        const posts = await ctx.runQuery(internal.linkedin.getPendingPosts);

        for (const post of posts) {
            // STRICT PLATFORM CHECK: Only process LinkedIn posts
            if (post.platform !== "linkedin") continue;

            try {
                // 1. Get User's Connection (Securely)
                const connection = await ctx.runQuery(internal.linkedin.getConnectionInternal, { userId: post.userId });

                if (!connection) {
                    await ctx.runMutation(internal.linkedin.updatePostStatus, {
                        postId: post._id, status: "FAILED", error: "No LinkedIn connection found"
                    });
                    continue;
                }

                // 2. Publish to LinkedIn
                let result;
                if (post.mediaStorageIds && post.mediaStorageIds.length > 0) {
                    // Multi-Image / Asset Logic
                    const assets = [];
                    for (const storageId of post.mediaStorageIds) {
                        const fileUrl = await ctx.storage.getUrl(storageId);
                        if (!fileUrl) continue;

                        const fileResponse = await fetch(fileUrl);
                        const fileBlob = await fileResponse.blob();
                        const isVideo = fileBlob.type.startsWith("video");
                        const assetType: "image" | "video" = isVideo ? "video" : "image";

                        // Upload each asset
                        const { assetUrn } = await uploadMediaAsset(
                            connection.accessToken,
                            connection.linkedinMemberId,
                            fileBlob,
                            assetType
                        );
                        assets.push({ assetUrn, type: assetType });
                    }

                    if (assets.length > 0) {
                        result = await postMultiMediaToLinkedIn(
                            connection.accessToken,
                            connection.linkedinMemberId,
                            post.content,
                            assets
                        );
                    } else {
                        // Fallback if asset upload failed
                        result = await postToLinkedIn(connection.accessToken, connection.linkedinMemberId, post.content);
                    }
                } else {
                    // Text Only
                    result = await postToLinkedIn(connection.accessToken, connection.linkedinMemberId, post.content);
                }

                if (post.firstComment && result?.id) {
                    try {
                        const urn = result.id; // e.g. urn:li:share:123 or urn:li:ugcPost:123
                        await postCommentToLinkedIn(connection.accessToken, urn, post.firstComment);
                    } catch (commentError) {
                        console.error(`Failed to post comment for ${post._id}:`, commentError);
                        // We don't fail the whole post if comment fails, just log it
                    }
                }

                // 3. Mark as Posted
                await ctx.runMutation(internal.linkedin.updatePostStatus, {
                    postId: post._id,
                    status: "POSTED",
                    platformPostId: result.id
                });
            } catch (error: any) {
                console.error(`Failed to publish post ${post._id}:`, error);
                await ctx.runMutation(internal.linkedin.updatePostStatus, {
                    postId: post._id,
                    status: "FAILED",
                    error: error.message || "Unknown error"
                });
            }
        }
    },
});

export const debugPublishPost = action({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const post = await ctx.runQuery(internal.linkedin.getPost, { postId: args.postId });
        if (!post) throw new Error("Post not found");

        const connection = await ctx.runQuery(internal.linkedin.getConnectionInternal, { userId: post.userId });
        if (!connection) throw new Error("No LinkedIn connection found");

        try {
            let result;
            if (post.mediaStorageIds && post.mediaStorageIds.length > 0) {
                const storageId = post.mediaStorageIds[0];
                const fileUrl = await ctx.storage.getUrl(storageId);
                if (!fileUrl) throw new Error("Could not get file URL");

                const fileResponse = await fetch(fileUrl);
                const fileBlob = await fileResponse.blob();
                const isVideo = fileBlob.type.startsWith("video");
                const assetType = isVideo ? "video" : "image";

                result = await postMediaToLinkedIn(
                    connection.accessToken,
                    connection.linkedinMemberId,
                    post.content,
                    fileBlob,
                    assetType
                );
            } else {
                result = await postToLinkedIn(connection.accessToken, connection.linkedinMemberId, post.content);
            }

            await ctx.runMutation(internal.linkedin.updatePostStatus, {
                postId: post._id,
                status: "POSTED",
                platformPostId: result.id
            });

            return { success: true, result };
        } catch (error: any) {
            console.error("Debug Publish Error:", error);
            await ctx.runMutation(internal.linkedin.updatePostStatus, {
                postId: post._id,
                status: "FAILED",
                error: error.message || "Unknown error"
            });
            throw new Error(`Publish failed: ${error.message}`);
        }
    }
});

// --- Helpers ---

// 1. Text Only Post
async function postToLinkedIn(accessToken: string, memberId: string, content: string) {
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify({
            "author": `urn:li:person:${memberId}`,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": content
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`LinkedIn API Error: ${response.status} ${text}`);
    }

    return await response.json();
}

// 2. Media Post (Image or Video)
async function postMediaToLinkedIn(accessToken: string, memberId: string, content: string, fileBlob: Blob, type: "image" | "video") {
    // Step 1: Register Upload
    const registerUrl = "https://api.linkedin.com/v2/assets?action=registerUpload";
    const registerBody = {
        "registerUploadRequest": {
            "recipes": [
                type === "image" ? "urn:li:digitalmediaRecipe:feedshare-image" : "urn:li:digitalmediaRecipe:feedshare-video"
            ],
            "owner": `urn:li:person:${memberId}`,
            "serviceRelationships": [
                {
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent"
                }
            ]
        }
    };

    const registerResponse = await fetch(registerUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify(registerBody)
    });

    if (!registerResponse.ok) throw new Error("Failed to register upload");
    const registerData = await registerResponse.json();

    // Extract upload URL and Asset URN
    const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    const assetUrn = registerData.value.asset;

    // Step 2: Upload File
    const uploadResponse = await fetch(uploadUrl, {
        method: "PUT", // LinkedIn uses PUT for binary upload
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/octet-stream"
        },
        body: fileBlob
    });

    if (!uploadResponse.ok) throw new Error("Failed to upload media file");

    // Step 3: Create Post with Asset
    const shareBody = {
        "author": `urn:li:person:${memberId}`,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": type === "image" ? "IMAGE" : "VIDEO",
                "media": [
                    {
                        "status": "READY",
                        "description": {
                            "text": "Shared via SocialFlow"
                        },
                        "media": assetUrn,
                        "title": {
                            "text": "Uploaded Media"
                        }
                    }
                ]
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    const shareResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify(shareBody)
    });

    if (!shareResponse.ok) {
        const text = await shareResponse.text();
        throw new Error(`LinkedIn Share Error: ${shareResponse.status} ${text}`);
    }

    return await shareResponse.json();
}

// 3. Helper: Upload Media Asset (Refactored from postMediaToLinkedIn)
async function uploadMediaAsset(accessToken: string, memberId: string, fileBlob: Blob, type: "image" | "video") {
    // Step 1: Register Upload
    const registerUrl = "https://api.linkedin.com/v2/assets?action=registerUpload";
    const registerBody = {
        "registerUploadRequest": {
            "recipes": [
                type === "image" ? "urn:li:digitalmediaRecipe:feedshare-image" : "urn:li:digitalmediaRecipe:feedshare-video"
            ],
            "owner": `urn:li:person:${memberId}`,
            "serviceRelationships": [
                {
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent"
                }
            ]
        }
    };

    const registerResponse = await fetch(registerUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify(registerBody)
    });

    if (!registerResponse.ok) throw new Error("Failed to register upload");
    const registerData = await registerResponse.json();

    // Extract upload URL and Asset URN
    const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    const assetUrn = registerData.value.asset;

    // Step 2: Upload File
    const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/octet-stream"
        },
        body: fileBlob
    });

    if (!uploadResponse.ok) throw new Error("Failed to upload media file");

    return { assetUrn };
}

// 4. Multi-Media Post
async function postMultiMediaToLinkedIn(accessToken: string, memberId: string, content: string, assets: { assetUrn: string, type: "image" | "video" }[]) {
    // LinkedIn UGC API supports multiple media items in separate 'media' entries
    const mediaItems = assets.map(asset => ({
        "status": "READY",
        "description": {
            "text": "Shared via SocialFlow"
        },
        "media": asset.assetUrn,
        "title": {
            "text": "Uploaded Media"
        }
    }));

    const shareBody = {
        "author": `urn:li:person:${memberId}`,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": assets.every(a => a.type === "image") ? "IMAGE" : "VIDEO", // Limitations: mixed might be tricky, assuming uniform for now
                "media": mediaItems
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    const shareResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify(shareBody)
    });

    if (!shareResponse.ok) {
        const text = await shareResponse.text();
        throw new Error(`LinkedIn Share Error: ${shareResponse.status} ${text}`);
    }

    return await shareResponse.json();
}

// 5. Post Comment Helper
async function postCommentToLinkedIn(accessToken: string, objectUrn: string, text: string) {
    // The objectUrn might be a full URN or just an ID depending on what api returns.
    // For UGC posts, it returns "urn:li:share:..." or "urn:li:ugcPost:..."
    // The endpoint is /socialActions/{urn}/comments

    // Ensure URN is encoded
    const encodedUrn = encodeURIComponent(objectUrn);
    const url = `https://api.linkedin.com/v2/socialActions/${encodedUrn}/comments`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        },
        body: JSON.stringify({
            "message": {
                "text": text
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LinkedIn Comment Error: ${response.status} ${errorText}`);
    }

    return await response.json();
}


