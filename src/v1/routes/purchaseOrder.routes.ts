import express from "express";
import {addPurchaseOrder,deletePurchaseOrderById,getAllPurchaseOrder,getPurchaseOrderById,updatePurchaseOrderById} from "@controllersv1/purchaseOrder.controller"
import { authorizeJwt } from "@middlewares/auth.middleware";
const router = express.Router();

router.get("/", authorizeJwt,getAllPurchaseOrder);
router.post("/",authorizeJwt, addPurchaseOrder);
// router.get("/getForSelectInput", getAllPurchaseOrderForSelectInput);

router.delete("/deleteById/:id",authorizeJwt, deletePurchaseOrderById);
router.patch("/updateById/:id",authorizeJwt, updatePurchaseOrderById);
router.get("/getById/:id",authorizeJwt, getPurchaseOrderById);


export default router;