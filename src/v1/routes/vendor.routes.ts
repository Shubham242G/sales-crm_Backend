import { addVendor, deleteVendorById, getAllVendor, getVendorById, updateVendorById, convertVendorToSalesContact } from "../controllers/vendor.controller";
import express from "express";
const router = express.Router();

router.post("/", addVendor);
router.get("/", getAllVendor);
router.delete("/deleteById/:id", deleteVendorById);
router.patch("/updateById/:id", updateVendorById);
router.get("/getById/:id", getVendorById);
router.post("/convert-to-sales-contact/:id", convertVendorToSalesContact);


export default router;
