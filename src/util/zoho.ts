import axios from "axios";
import { lte } from "lodash";



const CLIENT_ID = process.env.ZOHO_CLIENT_ID!;
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET!;
const REDIRECT_URI = process.env.ZOHO_REDIRECT_URI;
const TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token";
let refreshToken = process.env.REFRESH_TOKEN_ZOHO!;

let accessToken = process.env.ACCESS_TOKEN!;

let expiry = 0;

export const saveTokens = (newAccessToken: string, newRefreshToken: string, expiresIn: number) => {
    accessToken = newAccessToken;
    if (newRefreshToken) refreshToken = newRefreshToken; // only overwrite if provided
    expiry = Date.now() + expiresIn * 1000;
};

export const getAccessToken = async (): Promise<string> => {
    const now = Date.now();

    console.log("working", refreshToken, accessToken, CLIENT_ID, CLIENT_SECRET, now);


    if (!accessToken || now >= expiry) {
        console.log("🔄 Access token expired. Refreshing...");

        const res = await axios.post(TOKEN_URL, null, {
            params: {
                refresh_token: refreshToken,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "refresh_token",
            },
        });


        console.log("New access token received:", res);

        accessToken = res.data.access_token;
        expiry = now + res.data.expires_in * 1000;
    }

    console.log(accessToken, "access token");

    return accessToken;
};





export const zohoRequest = async <T = any>( 
data:string

): Promise<T> => {

    const orgId = process.env.ORG_ID_ZOHO!;

    console.log("workign zoho request ")
    const token = await getAccessToken();

    console.log(`chwcking ${`https://www.zohoapis.in/books/v3/${data}?organization_id=${orgId}`}`, token, orgId)

    const response = await axios({
        method: "GET",
        url: `https://www.zohoapis.in/books/v3/${data}?organization_id=${orgId}`,
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            "Content-Type": "application/json",
        },
    });

    // console.log("workign zoho request 2 ")

    console.log(response.data, "response zoho");

    return response.data;
};

export interface ZohoCustomerResponse {
    customers: any[]; // Replace `any` with your detailed Zoho customer interface if available
    page: number;
    per_page: number;
    total: number;
    code: number;
    message: string;
  }
  
//   export const zohoCustomerRequest = async (): Promise<ZohoCustomerResponse> => {
//     const orgId = process.env.ORG_ID_ZOHO!;
//     const token = await getAccessToken();
  
//     const response = await axios({
//       method: 'GET',
//       url: `https://www.zohoapis.in/books/v3/customers?organization_id=${orgId}`,
//       headers: {
//         Authorization: `Zoho-oauthtoken ${token}`,
//         'Content-Type': 'application/json',
//       },
//     });
  
//     return response.data;
//   };



// zohoRequest()


