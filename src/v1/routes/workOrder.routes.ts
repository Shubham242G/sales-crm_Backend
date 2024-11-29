import express from "express";
import { addWorkOrder, deleteWorkOrderById, getAllWorkOrder, getForSelectInput, getWorkOrderById, updateWorkOrderById } from "@controllersv1/workOrder.controller";
const router = express.Router();

router.get("/", getAllWorkOrder);
router.post("/", addWorkOrder);
router.get("/getForSelectInput", getForSelectInput);
router.delete("/deleteById/:id", deleteWorkOrderById);
router.patch("/updateById/:id", updateWorkOrderById);
router.get("/getById/:id", getWorkOrderById);

export default router;
