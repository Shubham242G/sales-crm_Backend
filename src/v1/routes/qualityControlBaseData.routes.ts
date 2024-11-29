import express from "express";
import {
    addQualityControlBaseData,
    deleteQualityControlBaseDataById,
    getAllQualityControlBaseData,
    // getAllQualityControlBaseDataForSelectInput,
    getQualityControlBaseDataById,
    updateQualityControlBaseDataById,
} from "@controllersv1/qualityControlBaseData.controller";
const router = express.Router();

router.get("/", getAllQualityControlBaseData);
router.post("/", addQualityControlBaseData);
// router.get("/getForSelectInput",getAllQualityControlBaseDataForSelectInput);
router.delete("/deleteById/:id", deleteQualityControlBaseDataById);
router.patch("/updateById/:id", updateQualityControlBaseDataById);
router.get("/getById/:id", getQualityControlBaseDataById);

export default router;
