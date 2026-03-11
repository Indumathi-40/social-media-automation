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

    // Ensure this matches the initiate route
    const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(
            new URL(
                "/dashboard/instagram?error=Configuration+Error:+Missing+Client+ID+or+Secret",
                baseUrl
            )
        );
    }

    try {
        // 1. Exchange Access Token
        const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(
            redirectUri
        )}&client_secret=${clientSecret}&code=${code}`;

        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            throw new Error(tokenData.error.message);
        }

        const { access_token: accessToken, expires_in: expiresInSeconds } = tokenData;

        // Calculate absolute expiry time
        const tokenExpiry = Date.now() + (expiresInSeconds * 1000);

        // 1.5. Debug Permissions
        console.log(`[Instagram Auth] Checking permissions for user: ${userId}`);
        const permUrl = `https://graph.facebook.com/v19.0/me/permissions?access_token=${accessToken}`;
        const permResponse = await fetch(permUrl);
        const permData = await permResponse.json();
        const grantedPermissions = permData.data?.filter((p: any) => p.status === 'granted').map((p: any) => p.permission) || [];
        console.log(`[Instagram Auth] Granted Permissions: ${grantedPermissions.join(', ')}`);

        // 2. Fetch User's Pages (Handle Pagination)
        let allPages: any[] = [];
        let nextPageUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&limit=100&access_token=${accessToken}`;

        while (nextPageUrl) {
            const pagesResponse = await fetch(nextPageUrl);
            const pagesData = await pagesResponse.json();

            if (pagesData.error) {
                console.error("[Instagram Auth] Pages fetch error:", pagesData.error);
                throw new Error(`Failed to fetch pages: ${pagesData.error.message}`);
            }

            if (pagesData.data) {
                allPages = [...allPages, ...pagesData.data];
            }

            nextPageUrl = pagesData.paging?.next || null;
        }

        // Find the first page with a connected Instagram Business Account
        let pageWithInstagram = allPages.find(
            (page: any) => page.instagram_business_account
        );

        // DEEP SCAN
        if (!pageWithInstagram && allPages.length > 0) {
            const deepScanResults = await Promise.all(
                allPages.map(async (page) => {
                    try {
                        const scanToken = page.access_token || accessToken;
                        const deepUrl = `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${scanToken}`;
                        const deepRes = await fetch(deepUrl);
                        const deepData = await deepRes.json();

                        if (deepData.instagram_business_account) {
                            return { ...page, instagram_business_account: deepData.instagram_business_account };
                        }
                    } catch (e) {
                        console.error(`[Instagram Auth] Deep scan failed for page ${page.id}`, e);
                    }
                    return null;
                })
            );
            pageWithInstagram = deepScanResults.find(result => result !== null);
        }

        if (!pageWithInstagram) {
            const pageSummary = allPages.map((p: any) => `${p.name} (Has IG: ${!!p.instagram_business_account ? 'YES' : 'NO'})`).join(', ');
            throw new Error(`Connection Failed. No linked Instagram Business Account found on your ${allPages.length} Facebook Pages. [${pageSummary}]`);
        }

        const instagramUserId = pageWithInstagram.instagram_business_account.id;
        const facebookPageId = pageWithInstagram.id;

        // 3. Fetch Instagram User Details
        const igUserUrl = `https://graph.facebook.com/v19.0/${instagramUserId}?fields=id,name,username,profile_picture_url&access_token=${accessToken}`;
        const igResponse = await fetch(igUserUrl);
        const igData = await igResponse.json();

        if (igData.error) {
            throw new Error(`Failed to fetch Instagram profile: ${igData.error.message}`);
        }

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
            facebookPageId: facebookPageId,
            name: igData.name || igData.username,
            username: igData.username,
            profilePictureUrl: igData.profile_picture_url,
        });

        return NextResponse.redirect(new URL("/dashboard/instagram", baseUrl));
    } catch (err: any) {
        console.error("Instagram OAuth Error:", err);
        const errorUrl = new URL(`/dashboard/instagram`, baseUrl);
        errorUrl.searchParams.set("error", err.message);
        return NextResponse.redirect(errorUrl);
    }
}
