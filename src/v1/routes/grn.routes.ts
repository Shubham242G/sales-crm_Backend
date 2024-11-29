import express from "express";

import { addGrn, deleteGrnById, getAllGrn, getGrnById, updateGrnById } from "@controllersv1/grn.controller";
const router = express.Router();


router.post("/", addGrn);
router.get("/", getAllGrn);
router.patch("/updateById/:id", updateGrnById);
router.get("/getById/:id", getGrnById);
router.delete("/deleteById/:id",deleteGrnById);

export default router;
