import express from "express";
import upload from "@helpers/fileUploads";
import { addProductCategories, bulkUpload, deleteProductCategoriesById, getAllProductCategories, getAllProductCategoriesForSelectInput, getProductCategoriesById, updateProductCategoriesById } from "@controllersv1/productCategory.controller"
const router = express.Router();


router.get("/", getAllProductCategories);
router.post("/", addProductCategories);
router.get("/getForSelectInput", getAllProductCategoriesForSelectInput);

router.delete("/deleteById/:id", deleteProductCategoriesById);
router.patch("/updateById/:id", updateProductCategoriesById);
router.get("/getById/:id", getProductCategoriesById);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)



export default router;
