import express from "express";
import {
    addProducts,
    bulkUpload,
    bulkUploadMachine,
    deleteProductsById,
    getAllProducts,
    getAllProductsForSelectInput,
    getProductsById,
    updateProductsById,
} from "@controllersv1/products.controller";
import upload from "@helpers/fileUploads";
const router = express.Router();

router.get("/", getAllProducts);
router.get("/getForSelectInput", getAllProductsForSelectInput);
router.post("/", addProducts);
router.delete("/deleteById/:id", deleteProductsById);
router.patch("/updateById/:id", updateProductsById);
router.get("/getById/:id", getProductsById);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)
router.post("/bulkUploadMachine", upload.single("excel"), bulkUploadMachine)

export default router;