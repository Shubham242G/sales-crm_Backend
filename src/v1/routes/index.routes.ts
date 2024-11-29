import express from "express";
import { IndexGet } from "@controllersv1/index.contoller";
import { addLog } from "@middlewares/logcreate.middleware";

const router = express.Router();

router.get("/", IndexGet);
router.post("/", addLog);


export default router;
