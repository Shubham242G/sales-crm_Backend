// // File: src/v1/service/zohoinvoice.service.ts

// import axios from 'axios';
// import fs from 'fs';
// import path from 'path';
// import { ZohoInvoice } from '@models/invoices.model';
// import { CONFIG } from '@common/config.common';

// // Zoho API configuration
// const ZOHO_CONFIG = {
//     clientId: process.env.CLIENT_ID_ZOHO || '',
//     clientSecret: process.env.CLIENT_SECERET_ZOHO || '',
//     redirectUri: process.env.ZOHO_REDIRECT_URI || '',
//     refreshToken: process.env.REFRESH_TOKEN_ZOHO || '',
//     organizationId: process.env.ORG_ID_ZOHO || '',
//     authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
//     tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
//     apiBaseUrl: 'https://books.zoho.com/api/v3'
// };

// // Store token in memory (in production, consider storing in database)
// let tokenData = {
//     access_token: '',
//     expires_at: 0
// };

// /**
//  * Get Zoho access token (create or refresh)
//  */


// console.log("working zoho 1")
// export const getZohoAccessToken = async () => {
//     try {
//         // Check if token exists and is still valid
//         if (tokenData.access_token && tokenData.expires_at > Date.now()) {
//             return tokenData.access_token;
//         }

//         console.log("Attempting to refresh Zoho token with:", {
//             refresh_token: ZOHO_CONFIG.refreshToken ? "exists" : "missing",
//             client_id: ZOHO_CONFIG.clientId ? "exists" : "missing",
//             client_secret: ZOHO_CONFIG.clientSecret ? "exists" : "missing"
//         });

//         // Request new access token using refresh token
//         const response = await axios.post(ZOHO_CONFIG.tokenUrl, null, {
//             params: {
//                 refresh_token: ZOHO_CONFIG.refreshToken,
//                 client_id: ZOHO_CONFIG.clientId,
//                 client_secret: ZOHO_CONFIG.clientSecret,
//                 grant_type: 'refresh_token'
//             }
//         });

//         console.log("Zoho token response:", response.data);

//         // Update token data
//         tokenData = {
//             access_token: response.data.access_token,
//             expires_at: Date.now() + (response.data.expires_in * 1000)
//         };

//         return tokenData.access_token;
//     } catch (error: any) {
//         console.error('Error getting Zoho access token:', error.response?.data || error.message);
//         console.error('Full error:', error);
//         throw new Error(`Failed to get Zoho access token: ${error.response?.data?.error || error.message}`);
//     }
// };

// /**
//  * Get list of invoices with optional filters
//  */
// export const getInvoices = async (fromDate?: string, toDate?: string, status?: string) => {
//     try {
//         const token = await getZohoAccessToken();

//         const params: any = {
//             organization_id: ZOHO_CONFIG.organizationId
//         };

//         // Add optional filters
//         if (fromDate) params.date_from = fromDate;
//         if (toDate) params.date_to = toDate;
//         if (status) params.status = status;

//         const response = await axios.get(`${ZOHO_CONFIG.apiBaseUrl}/invoices`, {
//             headers: {
//                 'Authorization': `Zoho-oauthtoken ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             params
//         });

//         // Save invoices to database if you need to cache them
//         if (response.data.invoices) {
//             for (const invoice of response.data.invoices) {
//                 await ZohoInvoice.findOneAndUpdate(
//                     { invoice_id: invoice.invoice_id },
//                     invoice,
//                     { upsert: true, new: true }
//                 );
//             }
//         }

//         return response.data;
//     } catch (error: any) {
//         console.error('Error fetching invoices from Zoho:', error.response?.data || error.message);
//         throw new Error('Failed to fetch invoices from Zoho');
//     }
// };

// /**
//  * Get invoice details by invoice ID
//  */
// export const getInvoiceDetails = async (invoiceId: string) => {
//     try {
//         const token = await getZohoAccessToken();

//         const response = await axios.get(`${ZOHO_CONFIG.apiBaseUrl}/invoices/${invoiceId}`, {
//             headers: {
//                 'Authorization': `Zoho-oauthtoken ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             params: {
//                 organization_id: ZOHO_CONFIG.organizationId
//             }
//         });

//         return response.data;
//     } catch (error: any) {
//         console.error(`Error fetching invoice ${invoiceId}:`, error.response?.data || error.message);
//         throw new Error(`Failed to fetch invoice ${invoiceId}`);
//     }
// };

// /**
//  * Download invoice PDF and return file path
//  */
// export const downloadInvoicePdf = async (invoiceId: string, outputPath?: string) => {
//     try {
//         const token = await getZohoAccessToken();

//         // Set default output path if not provided
//         if (!outputPath) {
//             const downloadsDir = path.join(process.cwd(), 'public', 'downloads', 'invoices');

//             // Create directory if it doesn't exist
//             if (!fs.existsSync(downloadsDir)) {
//                 fs.mkdirSync(downloadsDir, { recursive: true });
//             }

//             outputPath = path.join(downloadsDir, `invoice-${invoiceId}.pdf`);
//         }

//         const response = await axios.get(`${ZOHO_CONFIG.apiBaseUrl}/invoices/${invoiceId}/pdf`, {
//             headers: {
//                 'Authorization': `Zoho-oauthtoken ${token}`
//             },
//             params: {
//                 organization_id: ZOHO_CONFIG.organizationId
//             },
//             responseType: 'stream'
//         });

//         // Write to file
//         const writer = fs.createWriteStream(outputPath);
//         response.data.pipe(writer);

//         return new Promise<string>((resolve, reject) => {
//             writer.on('finish', () => resolve(outputPath ?? ""));
//             writer.on('error', reject);
//         });
//     } catch (error: any) {
//         console.error(`Error downloading invoice ${invoiceId}:`, error.response?.data || error.message);
//         throw new Error(`Failed to download invoice ${invoiceId}`);
//     }
// };