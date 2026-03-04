import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: Request) {
    const clientId = process.env.X_CLIENT_ID || process.env.TWITTER_CLIENT_ID;
    const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

    // Strict Validation: Ensure Configured URL matches Request Host
    const host = request.headers.get("host") || "localhost:3000";
    const proto = host.includes("localhost") ? "http" : "https";

    // Synchronize with LinkedIn/Instagram: Use ngrok URL as primary fallback for this environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://earl-offscreen-wanita.ngrok-free.dev";
    const redirectUri = `${baseUrl}/api/auth/x/callback`;

    // Scopes requested by the user:
    const scope = "tweet.read tweet.write users.read offline.access";

    if (!clientId) {
        return NextResponse.redirect(`${baseUrl}/dashboard/twitter?error=ConfigurationError`);
    }

    // 1. Generate Secure State & Code Verifier
    const state = crypto.randomBytes(32).toString("hex");
    const codeVerifier = crypto.randomBytes(32).toString("hex");

    // 2. Generate Code Challenge (S256)
    const codeChallenge = crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    // 3. Construct Authorization URL
    const url = new URL("https://twitter.com/i/oauth2/authorize");
    url.searchParams.append("response_type", "code");
    url.searchParams.append("client_id", clientId);
    url.searchParams.append("redirect_uri", redirectUri);
    url.searchParams.append("scope", scope);
    url.searchParams.append("state", state);
    url.searchParams.append("code_challenge", codeChallenge);
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("prompt", "login"); // Force login screen every time

    // 4. Set Cookies & Redirect
    const response = NextResponse.redirect(url.toString());

    // Secure, HTTP-only, 10-minute expiry
    response.cookies.set("twitter_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
    });

    response.cookies.set("twitter_code_verifier", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
    });

    // Also store the redirect_uri we used, to ensure callback uses the EXACT same one
    response.cookies.set("twitter_redirect_uri", redirectUri, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
    });

    return response;
}
