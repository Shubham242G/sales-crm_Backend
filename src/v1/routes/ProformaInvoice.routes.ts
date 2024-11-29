import express from "express";
import {addProformaInvoice,deleteProformaInvoiceById,getAllProformaInvoice,getProformaInvoiceById,updateProformaInvoiceById} from "@controllersv1/proformaInvoice.controller"
const router = express.Router();

router.get("/", getAllProformaInvoice);
router.post("/", addProformaInvoice);
// router.get("/getForSelectInput", getAllProformaInvoiceForSelectInput);

router.delete("/deleteById/:id", deleteProformaInvoiceById);
router.patch("/updateById/:id", updateProformaInvoiceById);
router.get("/getById/:id", getProformaInvoiceById);


export default router;