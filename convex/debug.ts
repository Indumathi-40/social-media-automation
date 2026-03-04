
import { query, internalMutation, internalQuery } from "./_generated/server";

export const whoami = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        return {
            identity,
            auth: ctx.auth
        };
    },
});

export const listAllConnections = query({
    handler: async (ctx) => {
        return await ctx.db.query("linkedin_connections").take(10);
    }
});

export const dumpDb = internalQuery({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const connections = await ctx.db.query("instagram_connections").collect();
        const logs = await ctx.db.query("logs").order("desc").collect();
        return {
            usersCount: users.length,
            users: users,
            connectionsCount: connections.length,
            connections: connections,
            logs: logs
        };
    },
});

export const clearLinkedin = internalMutation({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        for (const user of users) {
            await ctx.db.patch(user._id, {
                linkedinConnected: false,
                linkedinAvatar: undefined,
                linkedinConnectionId: undefined,
                linkedinUsername: undefined
            });
        }
        const connections = await ctx.db.query("linkedin_connections").collect();
        for (const conn of connections) {
            await ctx.db.delete(conn._id);
        }
        return "Cleared LinkedIn data";
    },
});
