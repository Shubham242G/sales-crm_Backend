import express from "express";
import {
    getAllVendorPurchaseBills,
    syncBillModels,
    deleteVendorPurchaseBillById,
    getVendorPurchaseBillById,
    //   getBillModelById,
} from "../controllers/vendorPurchaseBill.controller" // adjust path if needed

const router = express.Router();

// @route   GET /api/vendor-purchase-bills
// @desc    Get all bills

router.get("/bills", getAllVendorPurchaseBills);



router.delete("/delete/:id", deleteVendorPurchaseBillById);

router.get("/bills/:id", getVendorPurchaseBillById);

// @route   GET /api/vendor-purchase-bills/sync
// @desc    Sync bills from Zoho Books
router.get("/sync", syncBillModels);

// @route   GET /api/vendor-purchase-bills/:id
// @desc    Get bill by MongoDB ID
// router.get("/:id", getBillModelById);

export default router;
