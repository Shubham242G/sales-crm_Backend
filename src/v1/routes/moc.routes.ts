import { addMOC, bulkUpload, deleteMOCById, getAllMoc, getMocById, updateMOCById } from "@controllersv1/moc.controller";
import upload from "@helpers/fileUploads";
import express from "express";

const router = express.Router();


router.post("/", addMOC);
router.get("/", getAllMoc);
router.patch("/updateById/:id", updateMOCById);
router.get("/getById/:id", getMocById);
router.delete("/deleteById/:id", deleteMOCById);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)

export default router;
