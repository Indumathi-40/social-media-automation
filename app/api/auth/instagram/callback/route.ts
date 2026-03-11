import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");
    const errorDescription = searchParams.get("error_description");

    // Dynamically determine the base URL from the request origin
    const { origin: baseUrl } = new URL(request.url);

    if (error) {
        return NextResponse.redirect(
            new URL(
                `/dashboard/instagram?error=${encodeURIComponent(
                    errorDescription || errorReason || error
                )}`,
                baseUrl
            )
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL("/dashboard/instagram?error=No+code+provided", baseUrl)
        );
    }

    // --- AUTHENTICATION CHECK ---
    const { userId, getToken } = await auth();
    if (!userId) {
        console.error("[Instagram Callback] No authenticated user found");
        return NextResponse.redirect(
            new URL("/dashboard/instagram?error=Authentication+required", baseUrl)
        );
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const envRedirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    // Match initiation route detection logic
    const host = request.headers.get("host") || "";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const callbackBaseUrl = host.includes('localhost') ? `http://${host}` : `${protocol}://${host}`;

    const redirectUri = envRedirectUri || `${callbackBaseUrl}/api/auth/instagram/callback`;
    
    console.log(`[Instagram Callback] Using Robust Redirect URI: ${redirectUri}`);

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(
            new URL(
                "/dashboard/instagram?error=Configuration+Error:+Missing+Client+ID+or+Secret",
                baseUrl
            )
        );
    }

    try {
        console.log(`[Instagram Callback] Received code: ${code?.substring(0, 10)}...`);
        // 1. Exchange Code for Access Token
        // Using the Instagram token endpoint for the branded flow
        const cleanClientId = clientId.replace(/['"\s]/g, '');
        const cleanClientSecret = clientSecret.replace(/['"\s]/g, '');
        
        const tokenFormData = new FormData();
        tokenFormData.append("client_id", cleanClientId);
        tokenFormData.append("client_secret", cleanClientSecret);
        tokenFormData.append("grant_type", "authorization_code");
        tokenFormData.append("redirect_uri", redirectUri);
        tokenFormData.append("code", code);

        const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
            method: "POST",
            body: tokenFormData,
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error_message || !tokenData.access_token) {
            console.error("[Instagram Callback] Token exchange error:", tokenData);
            throw new Error(tokenData.error_message || "Failed to exchange code for access token");
        }

        let accessToken = tokenData.access_token;

        // 2. Fetch Instagram User Details
        console.log("[Instagram Callback] Fetching profile details from graph.instagram.com...");
        const igUserUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`;
        const igResponse = await fetch(igUserUrl);
        const igData = await igResponse.json();

        if (igData.error) {
            console.error("[Instagram Callback] Profile fetch failed:", igData.error);
            throw new Error(`Failed to fetch profile: ${igData.error.message || "Unknown Error"}`);
        }

        console.log(`[Instagram Callback] Successfully fetched profile for: ${igData.username}`);

        const expiresInSeconds = 3600; 
        const tokenExpiry = Date.now() + (expiresInSeconds * 1000);

        // 4. Store in Convex (AUTHENTICATED)
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        const convexToken = await getToken({ template: "convex" });
        if (convexToken) {
            convex.setAuth(convexToken);
        }

        await convex.mutation(api.instagram.registerConnection, {
            instagramUserId: igData.id,
            accessToken: accessToken,
            expiresIn: expiresInSeconds,
            tokenExpiry: tokenExpiry,
            name: igData.username || "Instagram User",
            username: igData.username || "instagram_user",
            profilePictureUrl: "",
        });

        return NextResponse.redirect(new URL("/dashboard/instagram", baseUrl));
    } catch (err: any) {
        console.error("Instagram OAuth Error:", err);
        const errorUrl = new URL(`/dashboard/instagram`, baseUrl);
        errorUrl.searchParams.set("error", err.message);
        return NextResponse.redirect(errorUrl);
    }
}
