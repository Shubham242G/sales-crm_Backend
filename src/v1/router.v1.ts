import indexRouter from "@routesv1/index.routes";
import userRouter from "@routesv1/user.routes";
import categoryRouter from "@routesv1/category.routes";
import hotelRouter from "@routesv1/hotel.routes";
import vendorRouter from "@routesv1/vendor.routes";
import banquetRouter from "@routesv1/banquet.routes";
import resturantRouter from "@routesv1/resturant.routes";
import salesContactRouter from "@routesv1/salesContact.routes";
import purchaseContactRouter from "@routesv1/purchaseContact.routes";
import enquiryRouter from "@routesv1/enquiry.routes";
import rfpRouter from "@routesv1/rfp.routes";
import leadRouter from "@routesv1/lead.routes";
import customerRouter from "@routesv1/customer.routes";
import taskManagementRouter from "@routesv1/taskManagement.routes";
import rolesRouter from "@routesv1/roles.routes";
import express from "express";

const router = express.Router();

router.use("/", indexRouter);
router.use("/users", userRouter);
router.use("/category", categoryRouter);
router.use("/hotel", hotelRouter);
router.use("/vendor", vendorRouter);
router.use("/banquet", banquetRouter);
router.use("/resturant", resturantRouter);
router.use("/salesContact", salesContactRouter);
router.use("/purchaseContact", purchaseContactRouter);
router.use("/enquiry", enquiryRouter);
router.use("/rfp", rfpRouter);
router.use("/lead", leadRouter);
router.use("/customer", customerRouter);
router.use("/task", taskManagementRouter);
router.use("/roles", rolesRouter);
// router.use("/adminroutes")

// =======<ryz>====== //

// router.use("/log", LogRouter)

// =======<>====== //

export default router;
