import express from "express";
import { addBom, deleteBomById, getAllBom, getBomById, getBomForStockChecking, updateBomById,bulkUpload } from "@controllersv1/bom.controller";
import upload from "@helpers/fileUploads";
const router = express.Router();

router.get("/", getAllBom);
router.post("/", addBom);
router.delete("/deleteById/:id", deleteBomById);
router.patch("/updateById/:id", updateBomById);
router.get("/getById/:id", getBomById);
router.get("/getBomForStockChecking/:id", getBomForStockChecking);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)


export default router;
