import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

const CLIENT_ID = process.env.CLIENT_ID_ZOHO!;
const CLIENT_SECRET = process.env.CLIENT_SECRET_ZOHO!;
const REDIRECT_URI = process.env.REDIRECT_URI!;

// Step 1: Redirect user to Zoho's OAuth
router.get("/zoho/authorize", (req: Request, res: Response) => {
    const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoBooks.fullaccess.all&client_id=${CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${REDIRECT_URI}&prompt=consent`;
    res.redirect(authUrl);
});

// Step 2: Receive grant code and exchange for tokens
router.get("/zoho/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) return res.status(400).send("Missing authorization code");

    try {
        const tokenResponse = await axios.post("https://accounts.zoho.com/oauth/v2/token", null, {
            params: {
                grant_type: "authorization_code",
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
            },
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        console.log("✅ Access Token:", access_token);
        console.log("🔄 Refresh Token:", refresh_token);

        // TODO: Save tokens securely in DB or file
        res.send(`Access token: ${access_token}<br>Refresh token: ${refresh_token}`);
    } catch (error: any) {
        console.error("❌ Token exchange failed:", error.response?.data || error.message);
        res.status(500).send("Error exchanging authorization code for tokens");
    }
});

export default router;
