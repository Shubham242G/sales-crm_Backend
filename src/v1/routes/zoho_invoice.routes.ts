import express from "express";
import { Router } from "express";
import {
    getAllInvoices,
    syncInvoices,
    generateInvoicePDF,
    getInvoiceById
} from "../controllers/zohoInvoice.controller";

const router = express.Router();

router.get("/invoices", getAllInvoices);


router.get("/sync", syncInvoices);


router.get('/invoices/pdf/:invoiceId', generateInvoicePDF);

router.get('/invoicesById/:id', getInvoiceById);

export default router;