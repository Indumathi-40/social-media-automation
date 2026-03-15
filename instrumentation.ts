export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;

        if (process.env.NODE_ENV === 'development') {
            const isNgrok = appUrl && (appUrl.includes("ngrok") || appUrl.includes("loca.lt"));

            if (!isNgrok) {
                console.error("\n\n");
                console.error("===============================================================");
                console.error("🚨 CONFIG WARNING: LIVE TUNNEL RECOMMENDED FOR OAUTH");
                console.error("===============================================================");
                console.error(`Current NEXT_PUBLIC_APP_URL: ${appUrl || "(not set)"}`);
                console.error("");
                console.error("Some OAuth providers require a public HTTPS URL.");
                console.error("1. Start ngrok: 'ngrok http 3000'");
                console.error("2. Update .env: NEXT_PUBLIC_APP_URL=https://your-id.ngrok-free.app");
                console.error("3. Restart this server.");
                console.error("===============================================================");
                console.error("\n\n");
                // We don't exit process here strictly to allow local dev of other features, 
                // but the error is prominent.
            } else {
                console.log(`\n✅ OAuth Tunnel Configured: ${appUrl}\n`);
            }
        }
    }
}
