import express from "express";
import {
    addMachine,
    bulkUpload,
    deleteMachineById,
    getAllMachine,
    getAllMachineForSelectInput,
    getMachineById,
    updateMachineById,
} from "@controllersv1/machines.controller";
import upload from "@helpers/fileUploads";
const router = express.Router();
router.post("/", addMachine);
router.get("/", getAllMachine);
router.get("/getAllMachineForSelectInput", getAllMachineForSelectInput);

router.get("/getById/:id", getMachineById);
router.patch("/updateById/:id", updateMachineById);
router.delete("/deleteById/:id", deleteMachineById);
router.post("/bulkUpload", upload.single("excel"), bulkUpload)

export default router;
