import express from "express";
import { bulkUpload, createVendors, deleteVendors, getAllVendorsForSelectInput, getAllVendorss, getVendors, updateVendors } from "@controllersv1/vendors.controller";
import upload from "@helpers/fileUploads";
const router = express.Router();

router.get("/", getAllVendorss);
router.post("/", createVendors);
router.get("/getVendorsForSelectInput", getAllVendorsForSelectInput);

router.delete("/deleteById/:id", deleteVendors);
router.patch("/updateById/:id", updateVendors);
router.get("/getById/:id", getVendors);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)


export default router;
