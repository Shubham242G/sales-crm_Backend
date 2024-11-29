import { addStore, bulkUpload, deleteStoreById, getAllStore, getStoreById, updateStoreById } from "@controllersv1/store.controller";
import upload from "@helpers/fileUploads";
import express from "express";

const router = express.Router();


router.post("/", addStore);
router.get("/", getAllStore);
router.patch("/updateById/:id", updateStoreById);
router.get("/getById/:id", getStoreById);
router.delete("/deleteById/:id", deleteStoreById);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)

export default router;
