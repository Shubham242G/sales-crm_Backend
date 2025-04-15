import express from "express";
// import { listInvoices, downloadInvoice, getInvoice } from "../controllers/zohoInvoice.controller";

import { Router } from "express";
import axios from "axios";
import { getAccessToken } from "../../util/zohoTokenManager";

const router = express.Router();

// router.get("/invoices", listInvoices);

// router.get("/invoices/:id", getInvoice);

// router.get("/invoices/:id/download", downloadInvoice);





router.get("/zoho", async (req, res) => {
    try {
        const token = await getAccessToken();

        const zohoRes = await axios.get("https://www.zohoapis.in/books/v3/invoices", {
            headers: {
                Authorization: `Zoho-oauthtoken ${token}`,
            },
        });

        res.json(zohoRes.data);
    } catch (err) {
        console.error("❌ Error fetching Zoho invoices", err);
        res.status(500).send("Error fetching invoices");
    }
});

export default router;



