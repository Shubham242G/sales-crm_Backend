import indexRouter from "@routesv1/index.routes";
import productCategoriesRouter from "@routesv1/productCategories.routes";
import customersRouter from "@routesv1/customer.routes";
import machineRouter from "@routesv1/machine.routes";
import rawMaterialCatgoriesRouter from "@routesv1/rawMaterialCatgories.routes";
import rawMaterialsRouter from "@routesv1/rawMaterial.routes";
import productRouter from "@routesv1/product.routes";
import productWiseMachineCapacityRouter from "@routesv1/ProductWiseMachineCapacity.routes";
import qualityControlBaseDataRouter from "@routesv1/qualityControlBaseData.routes";
import purchaseOrderRouter from "@routesv1/purchaseOrder.routes";
import proformaInvoiceRouter from "@routesv1/ProformaInvoice.routes";
import LogRouter from "@routesv1/log.routes";
import storeStockRouter from "@routesv1/storeStock.routes";
import userRouter from "@routesv1/user.routes";
import salesOrderRouter from "@routesv1/salesOrder.routes";
import bomRouter from "@routesv1/bom.routes";
import rawMaterialPurchaseIndentRouter from "@routesv1/rawMaterialPurchaseIndent.routes";
import rawMaterialQcRouter from "@routesv1/rawMaterialQc.routes";
import grnRouter from "@routesv1/grn.routes";
import mocRouter from "@routesv1/moc.routes";
import storeRouter from "@routesv1/store.routes";
import requestQuesRouter from "@routesv1/requestQues.routes";
import workOrderRouter from "@routesv1/workOrder.routes";
import schedulingSheetRouter from "@routesv1/schedulingSheet.routes";
import rawMaterialRequestRouter from "@routesv1/RawMaterialRequest.routes";
import deviceRouter from "@routesv1/device.routes";
import holidayRouter from "@routesv1/holiday.routes";
import employeeTypeRouter from "@routesv1/employeeType.routes";
import policyRouter from "@routesv1/policy.routes";
import shiftRouter from "@routesv1/shift.routes";
import levateTypeRouter from "@routesv1/leaveType.routes";
import rawMaterialProductionIndentRouter from "@routesv1/rawMaterialProductionIndent.routes";
import categoryRouter from "@routesv1/category.routes";
import hotelRouter from "@routesv1/hotel.routes";
import vendorRouter from "@routesv1/vendor.routes";
import express from "express";

const router = express.Router();

router.use("/", indexRouter);
router.use("/users", userRouter);
router.use("/productCatgories", productCategoriesRouter);
router.use("/category", categoryRouter);
router.use("/RawMaterialCatgories", rawMaterialCatgoriesRouter);
router.use("/customer", customersRouter);
router.use("/machine", machineRouter);
router.use("/product", productRouter);
router.use("/policy", policyRouter);
router.use("/shifts", shiftRouter);
router.use("/leaveTypes", levateTypeRouter);
router.use("/rawMaterials", rawMaterialsRouter);
router.use("/rawMaterialsRequest", rawMaterialRequestRouter);

router.use("/productWiseMachineCapacity", productWiseMachineCapacityRouter);
router.use("/qualityControlBaseData", qualityControlBaseDataRouter);
router.use("/storeStock", storeStockRouter);
router.use("/purchaseOrder", purchaseOrderRouter);
router.use("/proformaInvoice", proformaInvoiceRouter);
router.use("/bom", bomRouter);
router.use("/salesOrder", salesOrderRouter);
router.use("/rawMaterialPurchaseIndent", rawMaterialPurchaseIndentRouter);
router.use("/rawMaterialQc", rawMaterialQcRouter);
router.use("/grn", grnRouter);
router.use("/moc", mocRouter);
router.use("/store", storeRouter);
router.use("/requestQues", requestQuesRouter);
router.use("/workOrder", workOrderRouter);
router.use("/schedulingSheet", schedulingSheetRouter);
router.use("/rawMaterialProductionIndent", rawMaterialProductionIndentRouter);
router.use("/device", deviceRouter);
router.use("/holiday", holidayRouter);
router.use("/employeeType", employeeTypeRouter);
router.use("/hotel", hotelRouter);
router.use("/vendor", vendorRouter);

// =======<ryz>====== //

router.use("/log", LogRouter)

// =======<>====== //

export default router;
