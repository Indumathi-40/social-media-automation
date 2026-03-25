import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    console.log("!!! DEBUG: INSTAGRAM ROUTE IS RUNNING from app/api/auth/instagram/route.ts !!!");
    const { userId } = await getAuth(request);

    // Dynamically determine the base URL from the request origin
    const { origin: baseUrl } = new URL(request.url);

    if (!userId) {
        // Redirect to sign-in or return unauthorized
        return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const envRedirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    // Clean Credentials
    const cleanClientId = clientId?.trim().replace(/['"\s]/g, '');

    // Construct redirect URI - must match callback logic exactly
    const redirectUri = envRedirectUri || `${baseUrl}/api/auth/instagram/callback`;

    console.log(`[Instagram Auth] Initiation - Base URL: ${baseUrl}`);
    console.log(`[Instagram Auth] Initiation - Client ID (Clean): ${cleanClientId}`);
    console.log(`[Instagram Auth] Initiation - Redirect URI: ${redirectUri}`);

    // Scopes for Instagram Business Account
    const scopes = "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights";
    const state = "instagram_auth_" + userId; // Use userId in state for basic verification

    // Use the Instagram endpoint and parameters
    const url = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${cleanClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${scopes}&response_type=code&state=${state}`;

    console.log(`[Instagram Auth] Full Redirect URL: ${url}`);
    return NextResponse.redirect(url);
}
