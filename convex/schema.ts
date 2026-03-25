import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(), // Unique Clerk User ID
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        lastLoginAt: v.optional(v.number()),

        // Instagram Connection
        instagramUserId: v.optional(v.string()), // Platform User ID (Permanent Identity)
        instagramUsername: v.optional(v.string()),
        instagramProfilePic: v.optional(v.string()), // Keep for backward compat or easy access
        instagramConnected: v.boolean(),
        instagramLastConnectedAt: v.optional(v.number()), // NEW: Timestamp of last connection
        instagramLastDisconnectedAt: v.optional(v.number()), // NEW: Timestamp of last disconnection
        instagramProfile: v.optional(v.object({ // NEW: Detailed profile object
            id: v.string(),
            username: v.string(),
            name: v.optional(v.string()),
            imageUrl: v.optional(v.string()),
        })),

        // Legacy / Other
        instagramConnectionId: v.optional(v.string()),
        instagramAvatar: v.optional(v.string()),

        // LinkedIn Connection
        linkedinConnectionId: v.optional(v.string()),
        linkedinUsername: v.optional(v.string()),
        linkedinAvatar: v.optional(v.string()),
        linkedinConnected: v.boolean(),
        linkedinLastConnectedAt: v.optional(v.number()), // NEW
        linkedinLastDisconnectedAt: v.optional(v.number()), // NEW
        linkedinProfile: v.optional(v.object({ // NEW
            id: v.string(),
            username: v.optional(v.string()),
            name: v.string(),
            imageUrl: v.optional(v.string()),
            email: v.optional(v.string()),
        })),

        // Twitter Connection
        twitterConnected: v.optional(v.boolean()),

        // Legacy / Other
        updatedAt: v.number(),
    }).index("by_clerkId", ["clerkId"])
        .index("by_instagramUserId", ["instagramUserId"]), // Efficient lookup by Platform ID

    instagram_connections: defineTable({
        userId: v.string(), // users.clerkId
        instagramUserId: v.string(), // Instagram User ID

        // Auth Tokens
        accessToken: v.string(),
        expiresIn: v.optional(v.number()), // Seconds until expiration

        // Metadata
        name: v.string(),
        username: v.string(),
        profilePictureUrl: v.optional(v.string()), // Renamed from instagramProfilePic for consistency with LinkedIn
        facebookPageId: v.optional(v.string()), // ID of the Facebook Page linked to the Instagram Business Account
        tokenExpiry: v.optional(v.number()), // Timestamp of token expiration

        updatedAt: v.number(),
    }).index("by_userId", ["userId"])
        .index("by_instagramUserId", ["instagramUserId"]),



    linkedin_connections: defineTable({
        userId: v.string(), // users.clerkId
        linkedinMemberId: v.string(), // LinkedIn Member ID (URN)

        // Auth Tokens (Never exposed to client)
        accessToken: v.string(),
        expiresIn: v.number(), // Seconds until expiration
        refreshToken: v.optional(v.string()),
        refreshTokenExpiresIn: v.optional(v.number()),

        // Metadata
        name: v.string(),
        email: v.optional(v.string()),
        avatar: v.optional(v.string()), // Deprecated but keeping for now
        profileImage: v.optional(v.string()), // New field as requested

        updatedAt: v.number(),
    }).index("by_userId", ["userId"])
        .index("by_linkedinMemberId", ["linkedinMemberId"]),

    posts: defineTable({
        userId: v.string(),
        platform: v.string(), // "linkedin", "twitter", "instagram"
        content: v.string(),
        firstComment: v.optional(v.string()), // New field for first comment
        mediaUrls: v.optional(v.array(v.string())), // Array of image/video URLs
        mediaStorageIds: v.optional(v.array(v.string())), // Convex Storage IDs

        // Scheduling
        scheduledTime: v.number(), // Timestamp in ms
        status: v.string(), // "PENDING", "POSTED", "FAILED"

        // Results
        platformPostId: v.optional(v.string()), // ID returned by the platform after posting
        error: v.optional(v.string()),

        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_userId", ["userId"])
        .index("by_status_scheduledTime", ["status", "scheduledTime"]), // For cron job

    logs: defineTable({
        action: v.string(),
        level: v.string(), // "info", "error"
        data: v.any(),
        timestamp: v.number(),
    }).index("by_timestamp", ["timestamp"]),
});

