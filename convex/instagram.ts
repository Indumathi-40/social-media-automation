import { v } from "convex/values";
// Force rebuild
import { mutation, query, action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";

// --- Mutations ---

export const registerConnection = mutation({
    args: {
        instagramUserId: v.string(), // The Instagram Business Account ID
        accessToken: v.string(),
        expiresIn: v.optional(v.number()),
        name: v.string(),
        username: v.string(),
        profilePictureUrl: v.optional(v.string()),
        facebookPageId: v.optional(v.string()),
        tokenExpiry: v.optional(v.number()),
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
            .query("instagram_connections")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        // 2. SOCIAL MEDIA ISOLATION: Check if this Instagram account is ALREADY linked to a DIFFERENT user
        const occupiedConnection = await ctx.db
            .query("instagram_connections")
            .withIndex("by_instagramUserId", (q) => q.eq("instagramUserId", args.instagramUserId))
            .first();

        if (occupiedConnection && occupiedConnection.userId !== userId) {
            throw new Error("This Instagram account is already connected to another user. Please log out of Instagram in your browser and try again.");
        }

        const data = {
            userId: userId,
            instagramUserId: args.instagramUserId,
            accessToken: args.accessToken,
            expiresIn: args.expiresIn,
            name: args.name,
            username: args.username,
            profilePictureUrl: args.profilePictureUrl,
            facebookPageId: args.facebookPageId,
            tokenExpiry: args.tokenExpiry,
            updatedAt: Date.now(),
        };

        if (existingcnx) {
            await ctx.db.patch(existingcnx._id, data);
        } else {
            await ctx.db.insert("instagram_connections", data);
        }

        // 3. Sync to Users Table (For Frontend Compatibility)
        const userRecord = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
            .first();

        if (userRecord) {
            await ctx.db.patch(userRecord._id, {
                instagramUserId: args.instagramUserId,
                instagramUsername: args.username,
                instagramProfilePic: args.profilePictureUrl,
                instagramConnected: true,
                instagramLastConnectedAt: Date.now(),
                instagramProfile: {
                    id: args.instagramUserId,
                    username: args.username,
                    name: args.name,
                    imageUrl: args.profilePictureUrl,
                },
                updatedAt: Date.now(),
            });
        }
    },
});

export const disconnect = mutation({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.subject;

        const connection = await ctx.db
            .query("instagram_connections")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (connection) {
            await ctx.db.delete(connection._id);
        }
    }
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
            .query("instagram_connections")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();
    },
});

export const getPosts = query({
    args: { status: v.string() }, // "PENDING" or "POSTED" or "DRAFT"
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const userId = identity.subject;

        let posts;
        if (args.status === "PENDING") {
            // Include both PENDING and FAILED in the "Queue" tab
            posts = await ctx.db
                .query("posts")
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("platform"), "instagram"),
                        q.or(
                            q.eq(q.field("status"), "PENDING"),
                            q.eq(q.field("status"), "FAILED")
                        )
                    )
                )
                .order("desc")
                .collect();
        } else {
            posts = await ctx.db
                .query("posts")
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .filter((q) => q.eq(q.field("platform"), "instagram"))
                .filter((q) => q.eq(q.field("status"), args.status))
                .order("desc")
                .collect();
        }

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


// --- Posts & Scheduling (Reusing logic from LinkedIn but for Instagram) ---

export const createPost = mutation({
    args: {
        content: v.string(),
        scheduledTime: v.number(), // Unix timestamp
        mediaUrls: v.optional(v.array(v.string())), // External URLs
        mediaStorageIds: v.optional(v.array(v.string())), // Convex Storage IDs
        status: v.optional(v.string()), // "PENDING" | "DRAFT" | "POSTED" | "FAILED"
        // Instagram specific:
        mediaType: v.optional(v.string()), // "IMAGE", "VIDEO", "CAROUSEL"
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.subject;

        await ctx.db.insert("posts", {
            userId: userId,
            platform: "instagram",
            content: args.content,
            mediaUrls: args.mediaUrls,
            mediaStorageIds: args.mediaStorageIds,
            scheduledTime: args.scheduledTime,
            status: args.status || "PENDING",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            // Store extra metadata if needed
            // metadata: { mediaType: args.mediaType } 
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

export const getPendingPosts = internalQuery({
    handler: async (ctx) => {
        const now = Date.now();
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

// --- Actions (Cron Job Target) ---

export const publishPendingPosts = internalAction({
    handler: async (ctx) => {
        const posts = await ctx.runQuery(internal.instagram.getPendingPosts);

        for (const post of posts) {
            // Only process Instagram posts
            if (post.platform !== "instagram") continue;

            try {
                // 1. Get User's Connection
                const connection = await ctx.runQuery(internal.instagram.getConnectionInternal, { userId: post.userId });

                if (!connection) {
                    await ctx.runMutation(internal.instagram.updatePostStatus, {
                        postId: post._id, status: "FAILED", error: "No Instagram connection found"
                    });
                    continue;
                }

                // 2. Publish to Instagram
                let result;
                if (post.mediaStorageIds && post.mediaStorageIds.length > 0) {
                    const storageId = post.mediaStorageIds[0];
                    const fileUrl = await ctx.storage.getUrl(storageId);
                    if (!fileUrl) throw new Error("Could not get file URL");

                    result = await publishToInstagram(
                        connection.accessToken,
                        connection.instagramUserId,
                        post.content,
                        fileUrl
                    );
                } else {
                    // Instagram Business API REQUIRES an image or video for feed posts.
                    // If no media, we can't post to feed. Reels/Stories also require media.
                    throw new Error("Instagram posts require media (image or video)");
                }

                // 3. Mark as Posted
                const mediaId = result.id;
                let permalink = "";
                try {
                    permalink = await getInstagramPermalink(connection.accessToken, mediaId);
                } catch (e) {
                    console.error("Failed to get permalink:", e);
                    permalink = `https://www.instagram.com/reels/${mediaId}/`;
                }

                await ctx.runMutation(internal.instagram.updatePostStatus, {
                    postId: post._id,
                    status: "POSTED",
                    platformPostId: permalink || mediaId
                });
            } catch (error: any) {
                console.error(`Failed to publish Instagram post ${post._id}:`, error);
                await ctx.runMutation(internal.instagram.updatePostStatus, {
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
        const post = await ctx.runQuery(internal.instagram.getPost, { postId: args.postId });
        if (!post) throw new Error("Post not found");

        const connection = await ctx.runQuery(internal.instagram.getConnectionInternal, { userId: post.userId });
        if (!connection) throw new Error("No Instagram connection found");

        try {
            let result;
            if (post.mediaStorageIds && post.mediaStorageIds.length > 0) {
                const storageId = post.mediaStorageIds[0];
                const fileUrl = await ctx.storage.getUrl(storageId);
                if (!fileUrl) throw new Error("Could not get file URL");

                result = await publishToInstagram(
                    connection.accessToken,
                    connection.instagramUserId,
                    post.content,
                    fileUrl
                );
            } else {
                throw new Error("Instagram posts require media");
            }

            // result is the data from publishInstagramContainer, which contains { id: "media_id" }
            const mediaId = result.id;
            let permalink = "";
            try {
                permalink = await getInstagramPermalink(connection.accessToken, mediaId);
            } catch (e) {
                console.error("Failed to get permalink:", e);
                // Fallback to basic ID if permalink fails
                permalink = `https://www.instagram.com/reels/${mediaId}/`; // Temporary fallback
            }

            await ctx.runMutation(internal.instagram.updatePostStatus, {
                postId: args.postId,
                status: "POSTED",
                platformPostId: permalink || mediaId
            });

            return { success: true, result };
        } catch (error: any) {
            console.error("Debug Publish Error:", error);
            await ctx.runMutation(internal.instagram.updatePostStatus, {
                postId: post._id,
                status: "FAILED",
                error: error.message || "Unknown error"
            });
            throw new Error(`Publish failed: ${error.message}`);
        }
    }
});

// --- Helpers ---

// --- Internal Utilities for Cron/Actions ---

export const getConnectionInternal = internalQuery({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("instagram_connections")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
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

async function publishToInstagram(accessToken: string, instagramUserId: string, caption: string, imageUrl: string) {
    // Step 1: Create Media Container
    const containerId = await createInstagramContainer(accessToken, instagramUserId, caption, imageUrl);

    // Step 2: Wait for container to be ready (Polling)
    // The Instagram API can take a few seconds to process the image/video.
    let status = "IN_PROGRESS";
    let attempts = 0;
    while (status !== "FINISHED" && attempts < 10) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        status = await getMediaContainerStatus(accessToken, containerId);
        if (status === "ERROR") {
            throw new Error("Instagram Media Container processing failed.");
        }
    }

    if (status !== "FINISHED") {
        throw new Error("Instagram Media Container timed out while processing.");
    }

    // Step 3: Publish Container
    return await publishInstagramContainer(accessToken, instagramUserId, containerId);
}

async function getMediaContainerStatus(accessToken: string, containerId: string) {
    const url = `https://graph.facebook.com/v19.0/${containerId}`;
    const params = new URLSearchParams({
        fields: "status_code",
        access_token: accessToken,
    });

    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Error checking Instagram container status: ${data.error?.message || response.statusText}`);
    }

    return data.status_code; // Usually "FINISHED", "IN_PROGRESS", or "ERROR"
}

async function getInstagramPermalink(accessToken: string, mediaId: string) {
    const url = `https://graph.facebook.com/v19.0/${mediaId}`;
    const params = new URLSearchParams({
        fields: "permalink",
        access_token: accessToken,
    });

    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Error fetching Instagram permalink: ${data.error?.message || response.statusText}`);
    }

    return data.permalink;
}

async function createInstagramContainer(accessToken: string, instagramUserId: string, caption: string, imageUrl: string) {
    const url = `https://graph.facebook.com/v19.0/${instagramUserId}/media`;
    const params = new URLSearchParams({
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken,
    });

    const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Instagram Container Creation Error: ${data.error?.message || response.statusText}`);
    }

    return data.id; // creation_id
}

async function publishInstagramContainer(accessToken: string, instagramUserId: string, creationId: string) {
    const url = `https://graph.facebook.com/v19.0/${instagramUserId}/media_publish`;
    const params = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
    });

    const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Instagram Publish Error: ${data.error?.message || response.statusText}`);
    }

    return data; // contains the actual Post ID
}
