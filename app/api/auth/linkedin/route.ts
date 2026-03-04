import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { userId } = await auth();

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    // Use the specific ngrok URL if provided in env, otherwise fallback to detect from host
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
        (host.includes("ngrok-free.dev") ? `${protocol}://${host}` : "https://earl-offscreen-wanita.ngrok-free.dev");

    if (!userId) {
        return NextResponse.redirect(`${baseUrl}/sign-in`);
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

    if (!clientId) {
        return NextResponse.json({ error: "Missing LINKEDIN_CLIENT_ID" }, { status: 500 });
    }

    const scope = encodeURIComponent("openid profile email w_member_social");
    const state = "random_string_for_security";

    // Adding prompt=login and max_age=0 to EXPLICITLY force the LinkedIn login screen
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&prompt=login&max_age=0`;

    return NextResponse.redirect(url);
}
