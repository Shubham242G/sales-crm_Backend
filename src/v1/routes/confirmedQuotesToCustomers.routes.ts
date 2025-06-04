import { 
  addConfirmedQuotesToCustomer,
  deleteConfirmedQuotesToCustomerById,
  getAllConfirmedQuotesToCustomer,
  getConfirmedQuotesToCustomerById,
  updateConfirmedQuotesToCustomerById,
} from "../controllers/confirmedQuotesToCustomers.controller";
import express from "express";
const router = express.Router();

// CRUD Routes
router.post("/", addConfirmedQuotesToCustomer);
router.get("/", getAllConfirmedQuotesToCustomer);
router.delete("/deleteById/:id", deleteConfirmedQuotesToCustomerById);
router.patch("/updateById/:id", updateConfirmedQuotesToCustomerById);
router.get("/getById/:id", getConfirmedQuotesToCustomerById);



export default router;