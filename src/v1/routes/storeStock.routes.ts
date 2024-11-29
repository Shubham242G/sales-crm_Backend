import express from "express";

import { addStoreStock, deleteStoreStockById, getAllStocksForParticularStore, getAllStoreStock, getAllStoreStockForSelectInput, getStoreStockById, getStoreStockByStoreId, updateStoreStockById, UploadTodaysStoreStock } from "@controllersv1/storeStock.controller";
import { authorizeJwt } from "@middlewares/auth.middleware";
const router = express.Router();
router.post("/", addStoreStock);
router.get("/", getAllStoreStock);
router.get("/getAllStoreStockForSelectInput", getAllStoreStockForSelectInput);
router.get("/getAllStocksForParticularStore/:id",authorizeJwt, getAllStocksForParticularStore);
router.get("/getById/:id", getStoreStockById);
router.patch("/updateById/:id", updateStoreStockById);
router.delete("/deleteById/:id", deleteStoreStockById);
router.get("/getStoreStockByStoreId/:storeId",getStoreStockByStoreId);
router.post("/uploadStoreStocks", UploadTodaysStoreStock);

export default router;
