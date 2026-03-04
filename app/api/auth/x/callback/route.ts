
// import { NextResponse } from "next/server";
// import { ConvexHttpClient } from "convex/browser";
// import { api } from "@/convex/_generated/api";
// import { cookies } from "next/headers";
// import { auth } from "@clerk/nextjs/server";

// const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// export async function GET(request: Request) {
//     const { searchParams } = new URL(request.url);
//     const code = searchParams.get("code");
//     const state = searchParams.get("state");
//     const error = searchParams.get("error");

//     // Read Cookies
//     const cookieStore = await cookies();
//     const storedState = cookieStore.get("twitter_oauth_state")?.value;
//     const codeVerifier = cookieStore.get("twitter_code_verifier")?.value;
//     const storedRedirectUri = cookieStore.get("twitter_redirect_uri")?.value;

//     // Use the specific ngrok URL as primary fallback for this environment
//     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://earl-offscreen-wanita.ngrok-free.dev";

//     if (error) {
//         return NextResponse.redirect(`${baseUrl}/dashboard/twitter?error=${error}`);
//     }

//     if (!code || !state || !storedState || !codeVerifier) {
//         return NextResponse.redirect(`${baseUrl}/dashboard/twitter?error=invalid_request`);
//     }

//     if (state !== storedState) {
//         return NextResponse.redirect(`${baseUrl}/dashboard/twitter?error=invalid_state`);
//     }

//     // Fallback to Env if cookie missing (shouldn't happen in happy path)
//     const redirectUri = storedRedirectUri || `${baseUrl}/api/auth/x/callback`;

//     try {
//         const { userId } = await auth();
//         if (!userId) {
//             return NextResponse.redirect(`${baseUrl}/dashboard/twitter?error=unauthorized_no_user`);
//         }

//         // Exchange code for tokens (Server-Side Action)
//         await convex.action(api.twitter.generateTwitterTokens, {
//             code,
//             codeVerifier,
//             redirectUri,
//             userId // Pass userId explicitly
//         });

//         // Redirect to dashboard on success, clear cookies
//         const response = NextResponse.redirect(`${baseUrl}/dashboard/twitter?success=true`);
//         response.cookies.delete("twitter_oauth_state");
//         response.cookies.delete("twitter_code_verifier");
//         response.cookies.delete("twitter_redirect_uri");

//         return response;
//     } catch (err: any) {
//         console.error("Twitter OAuth Error:", err);
//         return NextResponse.redirect(`${baseUrl}/dashboard/twitter?error=${encodeURIComponent(err.message)}`);
//     }
// }


// mela ulla thu corrrect code deploy panna thu kadi na command paanirukka
//killa ulla thu deploy panna code chatgpt kudutha code



export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        message: "X OAuth temporarily disabled",
    });
}