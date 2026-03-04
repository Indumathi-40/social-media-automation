import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        // Redirect to sign-in or return unauthorized
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;

    // Use the specific ngrok URL if provided in env, otherwise fallback to NEXT_PUBLIC_APP_URL
    // The user explicitly requested: https://earl-offscreen-wanita.ngrok-free.dev/api/auth/instagram/callback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://earl-offscreen-wanita.ngrok-free.dev";
    const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

    if (!clientId) {
        return NextResponse.json(
            { error: "Missing INSTAGRAM_CLIENT_ID" },
            { status: 500 }
        );
    }

    // Instagram Graph API (via Facebook Login) permissions
    const scopes = [
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
    ].join(",");

    // Construct the Facebook Login Dialog URL
    // https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${scopes}&response_type=code&auth_type=reauthenticate`;

    return NextResponse.redirect(url);
}
