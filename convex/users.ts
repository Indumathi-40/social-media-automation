import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Sync Instagram Connection


// Sync LinkedIn Connection
export const syncLinkedinConnection = mutation({
    args: {
        clerkId: v.string(),
        connectionId: v.string(),
        username: v.string(),
        avatar: v.optional(v.string()),
        name: v.optional(v.string()), // Added
        email: v.optional(v.string()), // Added
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const now = Date.now();

        const updateData = {
            linkedinConnectionId: args.connectionId,
            linkedinUsername: args.username,
            linkedinAvatar: args.avatar,
            linkedinConnected: true,
            linkedinLastConnectedAt: now,
            linkedinProfile: {
                id: args.connectionId, // Using connectionId (Member ID) as ID
                username: args.username,
                name: args.name || args.username,
                imageUrl: args.avatar,
                email: args.email,
            },
            updatedAt: now,
        };

        if (existingUser) {
            await ctx.db.patch(existingUser._id, updateData);
        } else {
            await ctx.db.insert("users", {
                clerkId: args.clerkId,
                ...updateData,
                instagramConnected: false,
                twitterConnected: false,
            });
        }
    },
});

// Disconnect Instagram
export const disconnectInstagram = mutation({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                instagramConnected: false,
                instagramLastDisconnectedAt: Date.now(),
                // We keep the profile data for history, or we could clear it. 
                // Keeping it allows showing "Last connected as..."
            });
        }
    },
});

// Disconnect LinkedIn
export const disconnectLinkedin = mutation({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                linkedinConnected: false,
                linkedinLastDisconnectedAt: Date.now(),
            });
        }

        // Also remove the connection record so getConnection returns null
        const connection = await ctx.db
            .query("linkedin_connections")
            .withIndex("by_userId", (q) => q.eq("userId", args.clerkId))
            .first();

        if (connection) {
            await ctx.db.delete(connection._id);
        }
    },
});



export const getUser = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
        console.log(`[QUERY] getUser clerkId=${args.clerkId} found=${!!user} name=${user?.name} linkedin=${user?.linkedinConnected}`);
        return user;
    },
});

export const storeUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const now = Date.now();

        if (user) {
            await ctx.db.patch(user._id, {
                email: args.email,
                name: args.name,
                imageUrl: args.imageUrl,
                updatedAt: now,
            });
            return user._id;
        }

        const newUserId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            email: args.email,
            name: args.name,
            imageUrl: args.imageUrl,
            instagramConnected: false,
            linkedinConnected: false,
            twitterConnected: false,
            updatedAt: now,
        });
        return newUserId;
    },
});









export const internalLog = internalMutation({
    args: {
        action: v.string(),
        level: v.string(),
        data: v.any(),
        timestamp: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("logs", {
            action: args.action,
            level: args.level,
            data: args.data,
            timestamp: args.timestamp,
        });
    },
});
