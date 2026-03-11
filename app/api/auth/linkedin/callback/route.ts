import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    // Dynamically determine the base URL from the request origin
    const { origin: baseUrl } = new URL(req.url);

    if (error) {
        return NextResponse.redirect(new URL(`/dashboard/linkedin?error=${error}`, baseUrl));
    }

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    try {
        // 1. Authenticate with Clerk (Server-side)
        const { userId, getToken } = await auth();
        if (!userId) {
            console.error("Callback: No Clerk userId found. Redirecting.");
            return NextResponse.redirect(new URL("/dashboard/linkedin?error=Unauthorized_Session_Missing", baseUrl));
        }

        const convexToken = await getToken({ template: "convex" });
        if (!convexToken) {
            throw new Error("Failed to get Convex token. Ensure 'convex' template exists in Clerk.");
        }

        // Authenticate Convex Client
        convex.setAuth(convexToken);

        // 2. Exchange Code for Access Token
        const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: `${baseUrl}/api/auth/linkedin/callback`,
                client_id: process.env.LINKEDIN_CLIENT_ID!,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            }),
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            throw new Error(tokenData.error_description || "Failed to get access token");
        }

        // 3. Fetch User Profile (OpenID Connect)
        const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const profileData = await profileResponse.json();

        // 4. Save to Convex
        const name = profileData.name ||
            (profileData.given_name && profileData.family_name ? `${profileData.given_name} ${profileData.family_name}` :
                profileData.given_name || "LinkedIn User");

        await convex.mutation(api.linkedin.registerConnection, {
            linkedinMemberId: profileData.sub,
            accessToken: tokenData.access_token,
            expiresIn: tokenData.expires_in,
            name: name,
            email: profileData.email,
            avatar: profileData.picture,
            profileImage: profileData.picture,
        });

        // 5. Redirect back to Dashboard
        return NextResponse.redirect(new URL("/dashboard/linkedin", baseUrl));

    } catch (err: any) {
        console.error("LinkedIn OAuth Error:", err);
        return NextResponse.redirect(new URL(`/dashboard/linkedin?error=${encodeURIComponent(err.message)}`, baseUrl));
    }
}
