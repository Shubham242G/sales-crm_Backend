import express from "express";
import {
    addProductWiseMachineCapacity,
    bulkUpload,
    deleteProductWiseMachineCapacityById,
    getAllProductWiseMachineCapacity,
    getAllProductWiseMachineCapacityForSelectInput,
    getProductWiseMachineCapacityById,
    updateProductWiseMachineCapacityById,
} from "@controllersv1/productWiseMachineCapacity.controller";
import upload from "@helpers/fileUploads";
const router = express.Router();

router.get("/", getAllProductWiseMachineCapacity);
router.post("/", addProductWiseMachineCapacity);
router.get(
    "/getForSelectInput",
    getAllProductWiseMachineCapacityForSelectInput
);

router.delete("/deleteById/:id", deleteProductWiseMachineCapacityById);
router.patch("/updateById/:id", updateProductWiseMachineCapacityById);
router.get("/getById/:id", getProductWiseMachineCapacityById);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)

export default router;
