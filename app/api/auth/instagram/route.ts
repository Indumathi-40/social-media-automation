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

    // 4. Use the Facebook Login dialog for Instagram Business
    // This is more robust for automation apps and handles Business account discovery better
    const facebookScopes = [
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_comments",
        "instagram_manage_insights",
        "instagram_manage_messages",
        "pages_show_list",
        "pages_read_engagement",
        "public_profile"
    ].join(",");

    const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${cleanClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${facebookScopes}&response_type=code`;

    console.log(`[Instagram Auth] Full Redirect URL (Facebook Flow): ${url}`);
    return NextResponse.redirect(url);
}
