import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getPosts = query({
    args: {
        status: v.optional(v.string()), // "PENDING", "POSTED", "DRAFT"
        platform: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        const userId = identity.subject;

        let postQuery = ctx.db
            .query("posts")
            .withIndex("by_userId", (q) => q.eq("userId", userId));

        const posts = await postQuery.collect();

        // Manual filtering for simplicity if status/platform provided
        const filteredPosts = posts
            .filter(p => !args.status || p.status === args.status)
            .filter(p => !args.platform || p.platform === args.platform)
            .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

        // Enrich with media URLs
        return await Promise.all(filteredPosts.map(async (post) => {
            let mediaUrl = null;
            if (post.mediaStorageIds && post.mediaStorageIds.length > 0) {
                mediaUrl = await ctx.storage.getUrl(post.mediaStorageIds[0]);
            }
            return { ...post, mediaUrl };
        }));
    },
});

export const getUpcomingPosts = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        const userId = identity.subject;

        const posts = await ctx.db
            .query("posts")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("status"), "PENDING"))
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

export const createPost = mutation({
    args: {
        content: v.string(),
        scheduledTime: v.number(),
        platform: v.string(),
        mediaUrls: v.optional(v.array(v.string())),
        mediaStorageIds: v.optional(v.array(v.string())),
        status: v.optional(v.string()), // "PENDING" | "DRAFT" | "POSTED" | "FAILED"
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.subject;

        return await ctx.db.insert("posts", {
            userId: userId,
            platform: args.platform,
            content: args.content,
            mediaUrls: args.mediaUrls,
            mediaStorageIds: args.mediaStorageIds,
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
        mediaUrls: v.optional(v.array(v.string())),
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
        if (args.mediaUrls !== undefined) updates.mediaUrls = args.mediaUrls;
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
