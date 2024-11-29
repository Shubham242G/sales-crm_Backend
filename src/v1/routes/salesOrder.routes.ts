import express from "express";
import { authorizeJwt } from "@middlewares/auth.middleware";
import {
    addSalesOrder,
    deleteSalesOrderById,
    getAllSalesOrder,
    getPendingSalesOrderForWorkOrder,
    getSalesOrderById,
    getSalesOrderForWorkOrderById,
    getStoreOrderForStockChecking,
    updateSalesOrderById,
} from "@controllersv1/salesOrder.controller";
const router = express.Router();
router.post("/", authorizeJwt, addSalesOrder);
router.get("/", authorizeJwt, getAllSalesOrder);
router.get("/getById/:id", authorizeJwt, getSalesOrderById);
router.get("/getSalesOrderForWorkOrderById/:id/:productId", authorizeJwt, getSalesOrderForWorkOrderById);
router.get("/getStoreOrderForStockChecking/:id", authorizeJwt, getStoreOrderForStockChecking);
router.get("/getPendingSalesOrderForWorkOrder", authorizeJwt, getPendingSalesOrderForWorkOrder);
router.patch("/updateById/:id", authorizeJwt, updateSalesOrderById);
router.delete("/deleteById/:id", authorizeJwt, deleteSalesOrderById);
export default router;
