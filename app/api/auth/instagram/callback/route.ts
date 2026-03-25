import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAuth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");
    const errorDescription = searchParams.get("error_description");
    const state = searchParams.get("state");

    // Dynamically determine the base URL from the request origin
    const { origin: baseUrl } = new URL(request.url);

    console.log(`[Instagram Callback] Received request - Base URL: ${baseUrl}`);

    if (error) {
        console.error(`[Instagram Callback] OAuth Error: ${error}, Reason: ${errorReason}, Desc: ${errorDescription}`);
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
        console.error("[Instagram Callback] No code provided in query params");
        return NextResponse.redirect(
            new URL("/dashboard/instagram?error=No+code+provided", baseUrl)
        );
    }

    // --- AUTHENTICATION CHECK ---
    const { userId, getToken } = await getAuth(request);
    if (!userId) {
        console.error("[Instagram Callback] No authenticated user found via Clerk getAuth(request).");
        // Try to redirect back with a specific error
        return NextResponse.redirect(
            new URL("/dashboard/instagram?error=Authentication+required", baseUrl)
        );
    }

    console.log(`[Instagram Callback] Authenticated User: ${userId}`);

    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const envRedirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    // Use the same origin-based logic as the initiation route
    const redirectUri = envRedirectUri || `${baseUrl}/api/auth/instagram/callback`;
    
    console.log(`[Instagram Callback] Using Redirect URI: ${redirectUri}`);

    if (!clientId || !clientSecret) {
        console.error("[Instagram Callback] Missing configuration: CLIENT_ID or CLIENT_SECRET");
        return NextResponse.redirect(
            new URL(
                "/dashboard/instagram?error=Configuration+Error:+Missing+Client+ID+or+Secret",
                baseUrl
            )
        );
    }

    try {
        console.log(`[Instagram Callback] Exchanging code for access token...`);
        // 1. Exchange Code for Access Token
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
        let igData: any = null;

        // 2. Fetch Instagram User Details
        console.log("[Instagram Callback] Discovering profile details...");
        
        // --- Strategy A: Direct fetch (Instagram Basic/Branded) ---
        try {
            const igUserUrl = `https://graph.instagram.com/v21.0/me?fields=id,username,name,profile_picture_url,account_type&access_token=${accessToken}`;
            const igResponse = await fetch(igUserUrl);
            const data = await igResponse.json();
            if (!data.error) {
                igData = data;
                console.log("[Instagram Callback] Found profile via direct Graph IG fetch");
            } else {
                console.warn("[Instagram Callback] Direct Graph IG fetch failed:", data.error.message);
            }
        } catch (e) {
            console.warn("[Instagram Callback] Direct Graph IG fetch threw error:", e);
        }

        // --- Strategy B: Find via Pages (Standard Instagram Business API) ---
        if (!igData) {
            try {
                console.log("[Instagram Callback] Probing Facebook Pages for linked IG Business accounts...");
                const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,username,name,profile_picture_url},name&access_token=${accessToken}`;
                const pagesResponse = await fetch(pagesUrl);
                const pagesData = await pagesResponse.json();
                
                if (pagesData.data) {
                    for (const page of pagesData.data) {
                        if (page.instagram_business_account) {
                            igData = {
                                id: page.instagram_business_account.id,
                                username: page.instagram_business_account.username,
                                name: page.instagram_business_account.name || page.name,
                                profile_picture_url: page.instagram_business_account.profile_picture_url,
                                facebook_page_id: page.id
                            };
                            console.log(`[Instagram Callback] Found linked IG Business account "${igData.username}" on Page "${page.name}"`);
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error("[Instagram Callback] Pages discovery threw exception:", e);
            }
        }

        if (!igData) {
            throw new Error("Unable to identify which Instagram account you want to connect. Please ensure your account is a Business/Creator account and linked to a Facebook Page.");
        }

        console.log(`[Instagram Callback] Final identification: ${igData.username} (${igData.id})`);

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
            facebookPageId: igData.facebook_page_id
        });

        console.log(`[Instagram Callback] Successfully connected ${igData.username}. Redirecting to dashboard...`);
        return NextResponse.redirect(new URL("/dashboard/instagram", baseUrl));
    } catch (err: any) {
        console.error("Instagram OAuth Error:", err);
        const errorUrl = new URL(`/dashboard/instagram`, baseUrl);
        errorUrl.searchParams.set("error", err.message);
        return NextResponse.redirect(errorUrl);
    }
}
