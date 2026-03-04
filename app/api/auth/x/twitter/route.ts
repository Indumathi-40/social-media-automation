import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/x/callback`;

    // Scopes requested by the user:
    // tweet.read, tweet.write, users.read, offline.access
    const scope = "tweet.read tweet.write users.read offline.access";

    // In production, 'state' should be a random string stored in a cookie to prevent CSRF.
    const state = "state";

    // PKCE is recommended but for confidential clients (server-side exchange), 
    // we can use a static challenge if the client secret is kept secret.
    // Twitter requires code_challenge. We'll use 'challenge' with 'plain' method for simplicity here.
    // Ideally use crypto.createHash('sha256').update(verifier).digest('base64url')
    const codeChallenge = "challenge";
    const codeChallengeMethod = "plain";

    if (!clientId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/twitter?error=ConfigurationError`);
    }

    const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}`;

    return NextResponse.redirect(url);
}
