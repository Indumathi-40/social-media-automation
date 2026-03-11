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
        // We add name and profile_picture_url to get the "LinkedIn" same look.
        console.log("[Instagram Callback] Fetching profile details...");
        const igUserUrl = `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url,account_type&access_token=${accessToken}`;
        const igResponse = await fetch(igUserUrl);
        let igData = await igResponse.json();

        if (igData.error) {
            console.warn("[Instagram Callback] graph.instagram.com failed, trying graph.facebook.com fallback...");
            const fbMeUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,username,profile_picture_url&access_token=${accessToken}`;
            const fbResponse = await fetch(fbMeUrl);
            const fbData = await fbResponse.json();
            
            if (fbData.error) {
                console.error("[Instagram Callback] All profile fetch attempts failed:", igData.error, fbData.error);
                throw new Error(`Failed to fetch profile: ${igData.error.message || fbData.error.message}`);
            }
            igData = { 
                id: fbData.id, 
                username: fbData.username || fbData.name?.toLowerCase().replace(/\s/g, '_'),
                name: fbData.name,
                profile_picture_url: fbData.profile_picture_url?.data?.url || fbData.profile_picture_url
            };
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
            name: igData.name || "Instagram User",
            username: igData.username || igData.name || "instagram_user",
            profilePictureUrl: igData.profile_picture_url || "",
        });

        return NextResponse.redirect(new URL("/dashboard/instagram", baseUrl));
    } catch (err: any) {
        console.error("Instagram OAuth Error:", err);
        const errorUrl = new URL(`/dashboard/instagram`, baseUrl);
        errorUrl.searchParams.set("error", err.message);
        return NextResponse.redirect(errorUrl);
    }
}
