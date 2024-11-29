import express from "express";
import {
    createShift,
    getAllShifts,
    getShiftById,
    updateShift,
    deleteShift
} from "../controllers/shift.controller";

const router = express.Router();

router.post("/", createShift);
router.get("/", getAllShifts);
router.get("/:id", getShiftById);
router.put("/updateById/:id", updateShift);
router.delete("/deleteById/:id", deleteShift);

export default router;
