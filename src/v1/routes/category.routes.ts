import { addCategory, deleteCategoryById, getAllCategory, getCategoryById, updateCategoryById } from "../controllers/category.controller";
import express from "express";
const router = express.Router();

router.get("/", getAllCategory);
router.post("/", addCategory);
router.delete("/deleteById/:id", deleteCategoryById);
router.patch("/updateById/:id", updateCategoryById);
router.get("/getById/:id", getCategoryById);
// router.get("/getBomForStockChecking/:id", getBomForStockChecking);
// router.post("/bulkUpload", upload.single("excel"), bulkUpload)


export default router;
