import { addConfirmedQuotes, deleteConfirmedQuotesById, getAllConfirmedQuotes, getConfirmedQuotesById, updateConfirmedQuotesById, getAllQuoteId, getConfirmedQuotesByQuoteId, convertConfirmedQuotesFromVendorToQuotesToCustomer} from "../controllers/confirmedQuotesFromVendor.controller";
import express from "express";
const router = express.Router();

router.post("/", addConfirmedQuotes);
router.get("/", getAllConfirmedQuotes);
router.delete("/deleteById/:id", deleteConfirmedQuotesById);
router.patch("/updateById/:id", updateConfirmedQuotesById);
router.get("/getById/:id", getConfirmedQuotesById);
router.get("/getAllQuoteId" ,getAllQuoteId);
router.get("/getByQuoteId/:quoteId", getConfirmedQuotesByQuoteId);
// router.post("/convert-to-sales-contact/:id", convertConfirmedQuotesToSalesContact);
// router.get("/getAllConfirmedQuotesName", getAllConfirmedQuotesName);
 router.post("/convert-to-quotes-to-customer/:id", convertConfirmedQuotesFromVendorToQuotesToCustomer);
export default router;
