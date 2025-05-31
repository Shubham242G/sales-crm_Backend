import express from "express";
import { Router } from "express";
import {
    getAllInvoices,
    syncInvoices,
    downloadInvoiceTemplate,
    getInvoiceById
} from "../controllers/zohoInvoice.controller";
import { downloadExcelLead } from "../controllers/lead.controller";

const router = express.Router();

router.get("/invoices", getAllInvoices);


router.post("/sync", syncInvoices);

router.post('/getExcel', downloadInvoiceTemplate);


router.get('/invoicesById/:id', getInvoiceById);

export default router;