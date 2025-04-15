// src/v1/service/zohoinvoice.service.ts
import axios from 'axios';

const ZOHO_CONFIG = {
    authUrl: process.env.ZOHO_AUTH_URL || 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: process.env.ZOHO_TOKEN_URL || 'https://accounts.zoho.com/oauth/v2/token',
    clientId: process.env.ZOHO_CLIENT_ID || '',
    clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
    redirectUri: process.env.ZOHO_REDIRECT_URI || ''
};

// Add this function to your existing service file
const setupZohoAuthRoutes = (app: any) => {
    // Route to initiate OAuth flow


    console.log("Setting up Zoho auth routes...", ZOHO_CONFIG);
    app.get('/auth/zoho', (req: any, res: any) => {
        const authUrl = `${ZOHO_CONFIG.authUrl}?client_id=${ZOHO_CONFIG.clientId}&response_type=code&scope=ZohoBooks.fullaccess.all&redirect_uri=${ZOHO_CONFIG.redirectUri}&access_type=offline`;
        console.log("Redirecting for Zoho auth:", authUrl);
        res.redirect(authUrl);
    });

    // Route to handle the callback and get new tokens
    app.get('/auth/zoho/callback', async (req: any, res: any) => {
        try {
            const { code } = req.query;
            console.log("Received auth code:", code);

            const response = await axios.post(ZOHO_CONFIG.tokenUrl, null, {
                params: {
                    code,
                    client_id: ZOHO_CONFIG.clientId,
                    client_secret: ZOHO_CONFIG.clientSecret,
                    redirect_uri: ZOHO_CONFIG.redirectUri,
                    grant_type: 'authorization_code'
                }
            });

            console.log('New tokens received:', {
                access_token: response.data.access_token ? 'received' : 'missing',
                refresh_token: response.data.refresh_token ? 'received' : 'missing',
                expires_in: response.data.expires_in
            });

            // Display tokens (in production, save them securely)
            res.send(`
          <h1>Authentication successful!</h1>
          <p>Please save these tokens in your environment variables:</p>
          <pre>${JSON.stringify(response.data, null, 2)}</pre>
        `);
        } catch (error: any) {
            console.error('Auth error:', error.response?.data || error.message);
            res.status(500).send(`Authentication failed: ${JSON.stringify(error.response?.data || error.message)}`);
        }
    });
};


export default setupZohoAuthRoutes;