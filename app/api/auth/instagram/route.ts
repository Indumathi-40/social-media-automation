import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        // Redirect to sign-in or return unauthorized
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;

    // Dynamically determine the base URL from the request origin
    const { origin: baseUrl } = new URL(request.url);
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
