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
        // For Instagram Login for Business, we MUST use the Facebook Graph API token endpoint
        const cleanClientId = clientId.replace(/['"\s]/g, '');
        const cleanClientSecret = clientSecret.replace(/['"\s]/g, '');
        
        const tokenParams = new URLSearchParams({
            client_id: cleanClientId,
            client_secret: cleanClientSecret,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code: code,
        });

        console.log("[Instagram Callback] Exchanging code at graph.facebook.com...");
        const tokenResponse = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`);

        const tokenData = await tokenResponse.json();

        if (tokenData.error || !tokenData.access_token) {
            console.error("[Instagram Callback] Token exchange error:", tokenData.error || "No access token");
            throw new Error(tokenData.error?.message || "Failed to exchange code for access token");
        }

        let accessToken = tokenData.access_token;
        console.log("[Instagram Callback] Token exchange successful");

        // 2. Fetch Instagram User Details
        // We try to find the Instagram Business Account linked to the user's Facebook Pages
        console.log("[Instagram Callback] Fetching linked business accounts...");
        
        // Strategy: Fetch user's pages and their associated instagram_business_account
        const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`;
        const accountsResponse = await fetch(accountsUrl);
        const accountsData = await accountsResponse.json();

        if (accountsData.error) {
            console.error("[Instagram Callback] Failed to fetch accounts:", accountsData.error);
            // Fallback to direct /me check if the account fetch fails (unlikely for business login)
            const directMeUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,username&access_token=${accessToken}`;
            const directResponse = await fetch(directMeUrl);
            const directData = await directResponse.json();
            if (directData.error) throw new Error(`Failed to fetch profile: ${accountsData.error.message}`);
            
            // If we have no business account, we can't really "automate" but we can store the user
            throw new Error("No Instagram Business Account found. Please ensure your Instagram account is a Professional/Business account and linked to a Facebook Page.");
        }

        // Find the first Page with a linked Instagram Business Account
        const pageWithIG = accountsData.data?.find((page: any) => page.instagram_business_account);
        
        if (!pageWithIG) {
            console.error("[Instagram Callback] No linked Instagram Business Account found in pages:", accountsData.data);
            throw new Error("No Instagram Business Account found. Please ensure your Instagram account is a Professional/Business account and linked to a Facebook Page.");
        }

        const igData = pageWithIG.instagram_business_account;
        console.log(`[Instagram Callback] Found Business Account: ${igData.username} (ID: ${igData.id})`);

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
            name: igData.name || igData.username || "Instagram User",
            username: igData.username,
            profilePictureUrl: igData.profile_picture_url || "",
            facebookPageId: pageWithIG.id,
        });

        return NextResponse.redirect(new URL("/dashboard/instagram", baseUrl));
    } catch (err: any) {
        console.error("Instagram OAuth Error:", err);
        const errorUrl = new URL(`/dashboard/instagram`, baseUrl);
        errorUrl.searchParams.set("error", err.message);
        return NextResponse.redirect(errorUrl);
    }
}
