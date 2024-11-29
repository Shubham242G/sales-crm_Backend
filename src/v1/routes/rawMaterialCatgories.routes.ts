import express from "express";
import {
    addRawMaterialCategories,
    bulkUpload,
    deleteRawMaterialCategoriesById,
    getAllRawMaterialCategories,
    getAllRawMaterialCategoriesForSelectInput,
    getRawMaterialCategoriesById,
    updateRawMaterialCategoriesById,
} from "@controllersv1/rawMaterialCategory.controller";
import upload from "@helpers/fileUploads";
const router = express.Router();

router.get("/", getAllRawMaterialCategories);
router.get("/getForSelectInput", getAllRawMaterialCategoriesForSelectInput);
router.post("/", addRawMaterialCategories);
router.delete("/deleteById/:id", deleteRawMaterialCategoriesById);
router.patch("/updateById/:id", updateRawMaterialCategoriesById);
router.get("/getById/:id", getRawMaterialCategoriesById);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)


export default router;
