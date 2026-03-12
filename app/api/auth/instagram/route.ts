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

    // 4. Determine which flow to use based on the App ID or desired account type
    // If you have a Meta (Facebook) App ID, use the Facebook Dialog for Professional accounts
    // If you have an Instagram Basic Display ID, use the Instagram Dialog (Personal only)
    
    // Most professional integrations use the Facebook Dialog
    const isMetaApp = cleanClientId && cleanClientId.length >= 15;
    
    // We'll use the Facebook flow as primary for Business/Official accounts
    const facebookUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${cleanClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${scopes}&response_type=code&auth_type=reauthenticate`;

    // Legacy/Basic Instagram flow (Personal accounts only)
    const instagramUrl = `https://api.instagram.com/oauth/authorize?client_id=${cleanClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=user_profile,user_media&response_type=code`;

    // Strategy: Default to Facebook flow for Business, but provide easy switching if needed
    const url = facebookUrl;

    console.log(`[Instagram Auth] Flow: Meta/Facebook Business`);
    console.log(`[Instagram Auth] Full Redirect URL: ${url}`);
    
    return NextResponse.redirect(url);
}
