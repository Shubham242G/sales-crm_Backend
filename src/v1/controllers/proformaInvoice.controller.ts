import { ProformaInvoice } from "@models/proformaInvoice.model";
import { addLogs } from "@helpers/addLog";
export const addProformaInvoice = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await ProformaInvoice.findOne({
            name: new RegExp(`^${req.body.name}$`, "i"),
        }).exec();
        if (existsCheck) {
            throw new Error("ProformaInvoice  already exists");
        }
        await new ProformaInvoice(req.body).save();
        addLogs(
            "Proforma Invoice added",
            "Proforma Invoice",
            "Proforma Invoice"
        );
        res.status(201).json({ message: "ProformaInvoice Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllProformaInvoice = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj = {
                ...matchObj,
                $or: [
                    { "customerObj.name": new RegExp(req.query.query, "i") },
                    { totalAmount: new RegExp(req.query.query, "i") },
                    { billingAddress: new RegExp(req.query.query, "i") },
                    { deliveryAddress: new RegExp(req.query.query, "i") },
                ],
            };
        }
        let pageValue = req.query.pageIndex
            ? parseInt(`${req.query.pageIndex}`)
            : 0;
        let limitValue = req.query.pageSize
            ? parseInt(`${req.query.pageSize}`)
            : 1000;
        pipeline.push(
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerObj",
                },
            },
            {
                $unwind: {
                    path: "$customerObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $match: matchObj,
            },
            {
                $unwind: {
                    path: "$productsArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productsArr.productId",
                    foreignField: "_id",
                    as: "productObj",
                },
            },
            {
                $unwind: {
                    path: "$productObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    productArr: {
                        $addToSet: {
                            name: "$productObj.name",
                        },
                    },
                    customer: {
                        $first: {
                            name: "$customerObj.name",
                        },
                    },
                    billingAddress: {
                        $first: "$billingAddress",
                    },
                    deliveryAddress: {
                        $first: "$deliveryAddress",
                    },
                    timeOfPreperation: {
                        $first: "$timeOfPreperation",
                    },
                    invoiceNumber: {
                        $first: "$invoiceNumber",
                    },
                },
            },
            {
                $skip: pageValue * limitValue,
            },
            {
                $limit: limitValue,
            }
        );
        let ProformaInvoiceArr = await ProformaInvoice.aggregate(pipeline);
        res.status(201).json({
            message: "found all ProformaInvoice",
            data: ProformaInvoiceArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getProformaInvoiceById = async (req: any, res: any, next: any) => {
    try {
        let pipeline = [
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerObj",
                },
            },
            {
                $unwind: {
                    path: "$customerObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: "$productsArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productsArr.productId",
                    foreignField: "_id",
                    as: "productObj",
                },
            },
            {
                $unwind: {
                    path: "$productObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    productsArr: {
                        $addToSet: {
                            value: "$productsArr.productId",
                            label: "$productObj.name",
                            productId: "$productsArr.productId",
                            noOfPellets: "$productsArr.noOfPellets",
                            uom: "$productsArr.uom",
                            unitRate: "$productsArr.unitRate",
                            typeOfTax: "$productsArr.typeOfTax",
                            rateOfTax: "$productsArr.rateOfTax",
                            quantity: "$productsArr.quantity",
                            totalAmount: "$productsArr.totalAmount",
                        },
                    },
                    nameOfTransporter: {
                        $first: "$nameOfTransporter",
                    },
                    vehicleNumber: {
                        $first: "$vehicleNumber",
                    },
                    modeOfTransport: {
                        $first: "$modeOfTransport",
                    },
                    totalAmount: {
                        $first: "$totalAmount",
                    },
                    insurance: {
                        $first: "$insurance",
                    },
                    roundOff: {
                        $first: "$roundOff",
                    },
                    igst: {
                        $first: "$igst",
                    },
                    sgst: {
                        $first: "$sgst",
                    },
                    cgst: {
                        $first: "$cgst",
                    },
                    basicTotal: {
                        $first: "$basicTotal",
                    },
                    piRefNo: {
                        $first: "$piRefNo",
                    },
                    customer: {
                        $first: {
                            label: "$customerObj.name",
                            value: "$customerObj._id",
                        },
                    },
                    billingAddress: {
                        $first: "$billingAddress",
                    },
                    deliveryAddress: {
                        $first: "$deliveryAddress",
                    },
                    timeOfPreperation: {
                        $first: "$timeOfPreperation",
                    },
                    invoiceNumber: {
                        $first: "$invoiceNumber",
                    },
                },
            },
        ];

        let existsCheck = await ProformaInvoice.aggregate(pipeline);
        if (existsCheck.length == 0) {
            throw new Error("Proforma Invoice does not exists");
        }

        res.status(201).json({
            message: "found all Proforma Invoice",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};
export const updateProformaInvoiceById = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let existsCheck = await ProformaInvoice.findById(req.params.id)
            .lean()
            .exec();
        if (!existsCheck) {
            throw new Error("ProformaInvoice does not exists");
        }

        let ProformaInvoiceObj = await ProformaInvoice.findByIdAndUpdate(
            req.params.id,
            req.body
        ).exec();
        // addLogs("Proforma Invoice updated", ProformaInvoiceObj?._id, req.body);
        res.status(201).json({ message: "ProformaInvoice Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleteProformaInvoiceById = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let existsCheck = await ProformaInvoice.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("ProformaInvoice does not exists");
        }
        let ProformaInvoiceObj = await ProformaInvoice.findByIdAndDelete(
            req.params.id
        ).exec();
        addLogs(
            "Proforma Invoice removed",
            ProformaInvoiceObj?._id,
            "Proforma Invoice deleted"
        );
        res.status(201).json({ message: "ProformaInvoice Deleted" });
    } catch (error) {
        next(error);
    }
};
