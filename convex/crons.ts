import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "publish-linkedin-posts",
    { minutes: 1 },
    internal.linkedin.publishPendingPosts
);

crons.interval(
    "publish-instagram-posts",
    { minutes: 1 },
    internal.instagram.publishPendingPosts
);

export default crons;
