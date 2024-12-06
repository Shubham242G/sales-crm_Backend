import { addVendor } from "../controllers/vendor.controller";
import { addCategory, deleteCategoryById, getAllCategory, getCategoryById, updateCategoryById } from "../controllers/category.controller";
import express from "express";
const router = express.Router();

router.post("/", addVendor);
// router.get("/", getAllCategory);
// router.delete("/deleteById/:id", deleteCategoryById);
// router.patch("/updateById/:id", updateCategoryById);
// router.get("/getById/:id", getCategoryById);


export default router;
