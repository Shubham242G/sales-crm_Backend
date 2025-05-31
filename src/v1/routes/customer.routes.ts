
import express from "express";
import { Router } from "express";
import {
    getAllCustomers,
    syncCustomers,
    getCustomerById,
    addCustomer, deleteCustomerById, updateCustomerById,
    downloadExcelContact
} from "../controllers/customers.controller";

import { update } from "lodash";


console.log("working in customer router ")
const router = express.Router();

router.get("/customers", getAllCustomers);


router.get("/sync", syncCustomers);


router.post("/addCustomer", addCustomer);

router.post('/getExcel', downloadExcelContact);

router.post("/updateCustomer/:id", updateCustomerById);

router.delete("/deleteCustomer/:id", deleteCustomerById);

// router.get('/invoices/pdf/:invoiceId', generateInvoicePDF);

router.get('/customersById/:id', getCustomerById);

export default router;