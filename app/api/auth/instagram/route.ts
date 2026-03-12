import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
    console.log("!!! DEBUG: INSTAGRAM ROUTE IS RUNNING from app/api/auth/instagram/route.ts !!!");
    const { userId } = await auth();

    if (!userId) {
        // Redirect to sign-in or return unauthorized
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const envRedirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    // 1. Robust detection for Vercel/proxies
    const host = request.headers.get("host") || "";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = host.includes('localhost') ? `http://${host}` : `${protocol}://${host}`;

    // 2. Clean Credentials
    const cleanClientId = clientId?.trim().replace(/['"\s]/g, '');

    // 3. Construct redirect URI
    const redirectUri = envRedirectUri || `${baseUrl}/api/auth/instagram/callback`;

    console.log(`[Instagram Auth] Initiation - Host: ${host}, Protocol: ${protocol}`);
    console.log(`[Instagram Auth] Initiation - Client ID (Clean): ${cleanClientId}`);
    console.log(`[Instagram Auth] Initiation - Redirect URI: ${redirectUri}`);

    // Updated scopes for Instagram Business + discovery
    const scopes = "instagram_basic,instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights,pages_show_list,pages_read_engagement,public_profile";

    // 4. Use the exact working Instagram endpoint and parameters
    // Added auth_type=reauthenticate to help with account switching
    const url = `https://www.instagram.com/oauth/authorize?force_reauth=true&auth_type=reauthenticate&client_id=${cleanClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${scopes}&response_type=code`;

    console.log(`[Instagram Auth] Full Redirect URL: ${url}`);
    return NextResponse.redirect(url);
}
