import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://earl-offscreen-wanita.ngrok-free.dev";

    if (error) {
        return NextResponse.redirect(
            new URL(`/dashboard/twitter?error=${encodeURIComponent(error)}`, baseUrl)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL("/dashboard/twitter?error=No+code+provided", baseUrl)
        );
    }

    const { userId, getToken } = await auth();
    if (!userId) {
        return NextResponse.redirect(
            new URL("/dashboard/twitter?error=Authentication+required", baseUrl)
        );
    }

    const redirectUri = `${baseUrl}/api/auth/twitter/callback`;

    try {
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        const convexToken = await getToken({ template: "convex" });
        if (convexToken) {
            convex.setAuth(convexToken);
        }

        // We need the code_verifier used in the initiate route.
        // For now, using a placeholder to match the 'plain' method in route.ts
        const codeVerifier = "challenge";

        await convex.action(api.twitter.generateTwitterTokens, {
            code,
            codeVerifier,
            redirectUri,
            userId,
        });

        return NextResponse.redirect(new URL("/dashboard/twitter", baseUrl));
    } catch (err: any) {
        console.error("X OAuth Error:", err);
        const errorUrl = new URL(`/dashboard/twitter`, baseUrl);
        errorUrl.searchParams.set("error", err.message);
        return NextResponse.redirect(errorUrl);
    }
}
