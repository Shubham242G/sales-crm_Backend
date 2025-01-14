import indexRouter from "@routesv1/index.routes";
import userRouter from "@routesv1/user.routes";
import categoryRouter from "@routesv1/category.routes";
import hotelRouter from "@routesv1/hotel.routes";
import vendorRouter from "@routesv1/vendor.routes";
import banquetRouter from "@routesv1/banquet.routes";
import resturantRouter from "@routesv1/resturant.routes";
import contactRouter from "@routesv1/contact.routes";
import enquiryRouter from "@routesv1/enquiry.routes";
import rpfRouter from "@routesv1/rpf.routes";
import leadRouter from "@routesv1/lead.routes";
import customerRouter from "@routesv1/customer.routes";
import express from "express";

const router = express.Router();

router.use("/", indexRouter);
router.use("/users", userRouter);
router.use("/category", categoryRouter);
router.use("/hotel", hotelRouter);
router.use("/vendor", vendorRouter);
router.use("/banquet", banquetRouter);
router.use("/resturant", resturantRouter);
router.use("/contactUs", contactRouter);
router.use("/enquiry", enquiryRouter);
router.use("/rpf", rpfRouter);
router.use("/lead", leadRouter);
router.use("/customer", customerRouter);

// =======<ryz>====== //

// router.use("/log", LogRouter)

// =======<>====== //

export default router;
