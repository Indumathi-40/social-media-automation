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
        // Using the Facebook Graph API token endpoint for the Meta Login flow
        const cleanClientId = clientId.replace(/['"\s]/g, '');
        const cleanClientSecret = clientSecret.replace(/['"\s]/g, '');
        
        const tokenParams = new URLSearchParams({
            client_id: cleanClientId,
            client_secret: cleanClientSecret,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code: code
        });

        const tokenResponse = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`);
        const tokenData = await tokenResponse.json();

        if (tokenData.error_message || !tokenData.access_token) {
            console.error("[Instagram Callback] Token exchange error:", tokenData);
            throw new Error(tokenData.error_message || "Failed to exchange code for access token");
        }

        let accessToken = tokenData.access_token;
        let igData: any = null;

        // 2. Fetch Instagram User Details
        // We try multiple strategies for "Business" vs "Consumer" accounts
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
                // If direct fail, this is likely a Business token. 
                // We need to find the linked Instagram Business account via the user's pages.
                const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,username,name,profile_picture_url},name,access_token&access_token=${accessToken}`;
                const pagesResponse = await fetch(pagesUrl);
                const pagesData = await pagesResponse.json();
                
                if (pagesData.data && pagesData.data.length > 0) {
                    console.log(`[Instagram Callback] Found ${pagesData.data.length} Facebook pages. Searching for linked IG account...`);
                    // Look for the first page that has a linked Instagram Business Account
                    for (const page of pagesData.data) {
                        if (page.instagram_business_account) {
                            igData = {
                                id: page.instagram_business_account.id,
                                username: page.instagram_business_account.username,
                                name: page.instagram_business_account.name || page.name,
                                profile_picture_url: page.instagram_business_account.profile_picture_url,
                                facebook_page_id: page.id
                            };
                            console.log(`[Instagram Callback] Found Business Account via Page: ${igData.username}`);
                            break;
                        }
                    }
                    
                    if (!igData) {
                        console.warn("[Instagram Callback] Pages found, but none have a linked Instagram Business Account.");
                        throw new Error("We found your Facebook Pages, but none of them are linked to an Instagram Business account. Please link your Instagram to a Facebook Page in your Page Settings.");
                    }
                } else if (pagesData.error) {
                    console.error("[Instagram Callback] Pages API failed:", pagesData.error.message);
                } else {
                     console.warn("[Instagram Callback] No Facebook pages found for this user.");
                }
            } catch (e: any) {
                console.error("[Instagram Callback] Pages discovery failed:", e.message);
                if (e.message.includes("Facebook Page")) throw e; // Carry forward the specific linking error
            }
        }

        // --- Strategy C: Last Resort (Legacy /me) ---
        if (!igData) {
            const fbMeUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,username,profile_picture_url&access_token=${accessToken}`;
            const fbResponse = await fetch(fbMeUrl);
            const fbData = await fbResponse.json();
            if (fbData.error) {
                console.error("[Instagram Callback] All discovery strategies failed.");
                throw new Error("Unable to identify your Instagram Business account. Requirement: 1. Use a Professional Account. 2. Link it to a Facebook Page. 3. Grant 'Manage Pages' permission when connecting.");
            }
            igData = { 
                id: fbData.id, 
                username: fbData.username || fbData.name?.toLowerCase().replace(/\s/g, '_'),
                name: fbData.name,
                profile_picture_url: fbData.profile_picture_url?.data?.url || fbData.profile_picture_url
            };
        }

        console.log(`[Instagram Callback] Successfully identified: ${igData.username} (${igData.id})`);

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

        return NextResponse.redirect(new URL("/dashboard/instagram", baseUrl));
    } catch (err: any) {
        console.error("Instagram OAuth Error:", err);
        const errorUrl = new URL(`/dashboard/instagram`, baseUrl);
        errorUrl.searchParams.set("error", err.message);
        return NextResponse.redirect(errorUrl);
    }
}
