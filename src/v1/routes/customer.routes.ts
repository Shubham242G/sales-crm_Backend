import express from "express";
import upload from "@helpers/fileUploads";
import { bulkUpload, createCustomer, deleteCustomer, getAllCustomerForSelectInput, getAllCustomers, getCustomer, updateCustomer } from "../controllers/customer.controller";
// import { upload } from "@middlewares/multer.middleware";
const router = express.Router();

router.get("/", getAllCustomers);
router.post("/", createCustomer);
router.get("/getCustomerForSelectInput", getAllCustomerForSelectInput);

router.delete("/deleteById/:id", deleteCustomer);
router.patch("/updateById/:id", updateCustomer);
router.get("/getById/:id", getCustomer);

router.post("/bulkUpload", upload.single("excel"), bulkUpload)

export default router;
