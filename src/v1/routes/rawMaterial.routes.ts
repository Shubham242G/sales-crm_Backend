import express from "express";
import {
    addRawMaterialGroup,
    addRawMaterials,
    bulkUpload,
    bulkUploadRawMaterialsQC,
    deleteRawMaterialsById,
    getAllRawMaterials,
    getAllRawMaterialsForSelectInput,
    getRawMaterialGroupByOutputId,
    getRawMaterialsById,
    updateRawMaterialsById,
} from "@controllersv1/rawMaterial.controller";
import upload from "@helpers/fileUploads";
const router = express.Router();

router.get("/", getAllRawMaterials);
router.get("/getForSelectInput", getAllRawMaterialsForSelectInput);
router.post("/", addRawMaterials);
router.delete("/deleteById/:id", deleteRawMaterialsById);
router.patch("/updateById/:id", updateRawMaterialsById);
router.get("/getById/:id", getRawMaterialsById);


router.post("/addRawMaterialGroup", addRawMaterialGroup);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)
router.post("/bulkUploadRawMaterialsQC", upload.single("excel"), bulkUploadRawMaterialsQC)


router.get("/getRawMaterialGroupByOutputId/:id", getRawMaterialGroupByOutputId)
export default router;
