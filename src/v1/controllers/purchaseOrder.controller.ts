import { DEPARTMENT, GENERALSTATUS, ROLES } from "@common/constant.common";
import { addLogs } from "@helpers/addLog";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { IPurchaseOrder, PurchaseOrder } from "@models/purchaseOrder.model";
import { RawMaterialPurchaseIndent } from "@models/rawMaterialPurchaseIndent.modal";
import { User } from "@models/user.model";
import mongoose from "mongoose";
import { rawMaterialPurchaseOrderByIdPipeline } from "../../builders/rawMaterialPurchaseOrder.builder";
import { getNewValueForSeries } from "../../util/series";
import { addApprovalRequest } from "@helpers/addApprovalRequest";
import { REQUEST_TYPES } from "@common/request.common";
import { SalesOrder } from "@models/salesOrder.model";
import { Customer } from "@models/customer.model";
import { RawMaterials } from "@models/rawMaterials.model";
export const addPurchaseOrder = async (req: any, res: any, next: any) => {
    try {
        if (!req.body.poArr || req.body.poArr.length == 0) {
            throw new Error("Invalid data submitted !!!!");
        }
        let lastPurchaseOrderObj = await PurchaseOrder.findOne({}).sort({ createdAt: -1 }).exec();
        let lastSequence = 1;

        if (lastPurchaseOrderObj?.purchaseOrderNo) {
            lastSequence = Number(lastPurchaseOrderObj?.purchaseOrderNo.split("/")[1]);
            lastSequence = lastSequence + 1;
        }

        for (let index = 0; index < req.body.poArr.length; index++) {
            if (req.body.poArr[index].filesArr && req.body.poArr[index].filesArr.length > 0) {
                for (let i = 0; i < req.body.poArr[index].filesArr.length; i++) {
                    const element = req.body.poArr[index].filesArr[i];

                    if (element.fileUrl && `${element.fileUrl}`.includes("base64")) {
                        let fileUrl = await storeFileAndReturnNameBase64(element.fileUrl);
                        req.body.poArr[index].filesArr[i].fileUrl = fileUrl;
                    }
                }
            }
            if (req.body.poArr[index].salesOrderId) {
                let saleOrderObj = await SalesOrder.findById(req.body.poArr[index].salesOrderId).exec();
                if (saleOrderObj) {
                    req.body.poArr[index].salesOrderObj = saleOrderObj;
                }
            }

            if (req.body.poArr[index].customerId) {
                let customerObj = await Customer.findById(req.body.poArr[index].customerId).exec();
                if (customerObj) {
                    req.body.poArr[index].customerObj = customerObj;
                }
            }

            if (req.body.poArr[index].indentId) {
                let rawMaterialPurchaseIndentObj = await RawMaterialPurchaseIndent.findById(req.body.poArr[index].indentId).exec();
                if (rawMaterialPurchaseIndentObj) {
                    req.body.poArr[index].rawMaterialPurchaseIndentObj = rawMaterialPurchaseIndentObj;
                }
            }

            for (let i = 0; i < req.body.poArr[index].rawMaterialsArr.length; i++) {
                const element = req.body.poArr[index].rawMaterialsArr[i];
                if (element.rawMaterialId) {
                    let rawMaterialObj = await RawMaterials.findById(element.rawMaterialId).exec();
                    if (rawMaterialObj) {
                        element.rawMaterialObj = rawMaterialObj;
                    }
                }
            }

            let indentObj = await RawMaterialPurchaseIndent.findById(req.body.poArr[index].indentId).exec();
            if (!indentObj) {
                throw new Error("Indent not found");
            }

            req.body.poArr[index].purchaseOrderNo = await getNewValueForSeries(indentObj.indentType, "PO");
        }
        let ExistCheck = await PurchaseOrder.find({
            salesOrderId: {
                $in: req.body.poArr.map((el: any) => new mongoose.Types.ObjectId(el.salesOrderId)),
            },
            indentId: {
                $in: req.body.poArr.map((el: any) => new mongoose.Types.ObjectId(el.indentId)),
            },
        });
        // if (ExistCheck.length > 0) {
        //     throw new Error("Purchase order for same purchase indent already exists");
        // }

        let purchaseOrdersArr: any[] = await PurchaseOrder.insertMany(req.body.poArr.map((el: any) => ({ ...el, status: GENERALSTATUS.POGENERATED })));
        console.log(
            purchaseOrdersArr,
            "purchaseOrdersArr",
            purchaseOrdersArr.length,
            "purchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArrpurchaseOrdersArr"
        );
        for (let q = 0; q < purchaseOrdersArr.length; q++) {
            const element = purchaseOrdersArr[q];
            ///////////////////approval module starts here
            let usersArr = await User.find({
                role: {
                    $in: [ROLES.MANAGEMENT, ROLES.MANAGER, ROLES.STOREINCHARGE],
                },
                department: {
                    $in: [DEPARTMENT.PURCHASE],
                },
            }).exec();

            let previousDataPipeline = rawMaterialPurchaseOrderByIdPipeline(String(element?._id));
            console.log(previousDataPipeline, "previousDataPipeline", JSON.stringify(previousDataPipeline, null, 2));
            let previousDataObj = await PurchaseOrder.aggregate(previousDataPipeline);

            if (previousDataObj && previousDataObj.length > 0) {
                previousDataObj = previousDataObj[0];
            }

            /////////////approval module ends here
            await addApprovalRequest(
                PurchaseOrder,
                element?._id,
                req.user.userObj,
                REQUEST_TYPES.RAW_MATERIAL_PURCHASE_ORDER.ADD,
                previousDataObj,
                usersArr.map((el) => ({ name: el.name, approverId: el._id, approvalStatus: el._id == req.user.userId })),
                undefined,
                undefined,
                `New Raw material puchase order added by ${req?.user?.userObj?.name}`
            );
        }

        let pi = await RawMaterialPurchaseIndent.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(req.body.poArr[0].indentId),
            },
            {
                status: GENERALSTATUS.POGENERATED,
            },
            { new: true }
        ).exec();

        await SalesOrder.findByIdAndUpdate(req.body.poArr[0].salesOrderId, { status: GENERALSTATUS.POGENERATED }).exec();

        res.status(201).json({ message: "PurchaseOrder Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllPurchaseOrder = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj = {
                ...matchObj,
                $or: [{ "customerObj.name": new RegExp(req.query.query, "i") }, { totalAmount: new RegExp(req.query.query, "i") }],
            };
        }
        let pageValue = req.query.pageIndex ? parseInt(`${req.query.pageIndex}`) : 0;
        let limitValue = req.query.pageSize ? parseInt(`${req.query.pageSize}`) : 1000;
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
                    path: "$rawMaterialsArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "rawmaterials",
                    localField: "rawMaterialsArr.rawMaterialId",
                    foreignField: "_id",
                    as: "rawMaterialObj",
                },
            },
            {
                $unwind: {
                    path: "$rawMaterialObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    customerId: {
                        $first: {
                            label: "$customerObj.name",
                            value: "$customerObj._id",
                        },
                    },
                    purchaseOrderNo: {
                        $first: "$purchaseOrderNo",
                    },
                    indentNo: {
                        $first: "$indentNo",
                    },
                    quotationNo: {
                        $first: "$quotationNo",
                    },
                    purchaseOrderDate: {
                        $first: "$purchaseOrderDate",
                    },
                    basicTotal: {
                        $first: "$basicTotal",
                    },
                    cgst: {
                        $first: "$cgst",
                    },
                    sgst: {
                        $first: "$sgst",
                    },
                    igst: {
                        $first: "$igst",
                    },
                    roundOff: {
                        $first: "$roundOff",
                    },
                    totalAmount: {
                        $first: "$totalAmount",
                    },
                    deliveryDate: {
                        $first: "$deliveryDate",
                    },
                    paymentTerms: {
                        $first: "$paymentTerms",
                    },
                    freight: {
                        $first: "$freight",
                    },
                    modeOfDispatch: {
                        $first: "$modeOfDispatch",
                    },
                    dispatchArrangement: {
                        $first: "$dispatchArrangement",
                    },
                    methodOfProductApproval: {
                        $first: "$methodOfProductApproval",
                    },
                    insurance: {
                        $first: "$insurance",
                    },
                    dispatchDestination: {
                        $first: "$dispatchDestination",
                    },
                    note: {
                        $first: "$note",
                    },
                    issuedby: {
                        $first: "$issuedby",
                    },
                    issuedbyDate: {
                        $first: "$issuedbyDate",
                    },
                    verifiedby: {
                        $first: "$verifiedby",
                    },
                    verifiedbyDate: {
                        $first: "$verifiedbyDate",
                    },
                    approvedby: {
                        $first: "$approvedby",
                    },
                    approvedbyDate: {
                        $first: "$approvedbyDate",
                    },
                    distribution: {
                        $first: "$distribution",
                    },
                    retentionPeriod: {
                        $first: "$retentionPeriod",
                    },
                    effectiveDate: {
                        $first: "$effectiveDate",
                    },
                    revNo: {
                        $first: "$revNo",
                    },
                    revDate: {
                        $first: "$revDate",
                    },
                    createdAt: {
                        $first: "$createdAt",
                    },
                    updatedAt: {
                        $first: "$updatedAt",
                    },
                    status: {
                        $first: "$status",
                    },
                    rawMaterialsArr: {
                        $addToSet: {
                            label: "$rawMaterialObj.name",
                            value: "$rawMaterialObj._id",
                            rawMaterialId: "$rawMaterialsArr.rawMaterialId",
                            quantity: "$rawMaterialsArr.quantity",
                            unitRate: "$rawMaterialsArr.unitRate",
                            uom: "$rawMaterialsArr.uom",
                            totalAmount: "$rawMaterialsArr.totalAmount",
                        },
                    },
                },
            },
            {
                $sort: {
                    deliveryDate: 1,
                },
            },

            {
                $skip: pageValue * limitValue,
            },
            {
                $limit: limitValue,
            }
        );
        let PurchaseOrderArr = await PurchaseOrder.aggregate(pipeline);
        res.status(201).json({
            message: "found all PurchaseOrder",
            data: PurchaseOrderArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getPurchaseOrderById = async (req: any, res: any, next: any) => {
    try {
        let pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id),
                },
            },
            {
                $unwind: {
                    path: "$rawMaterialsArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "rawmaterials",
                    localField: "rawMaterialsArr.rawMaterialId",
                    foreignField: "_id",
                    as: "rawMaterialObj",
                },
            },
            {
                $unwind: {
                    path: "$rawMaterialObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "rawMaterialObj.name": {
                        $concat: ["$rawMaterialObj.name", " (", "$rawMaterialObj.specification", ")"],
                    },
                },
            },
            {
                $lookup: {
                    from: "grns",
                    localField: "_id",
                    foreignField: "poId",
                    let: {
                        rawMaterialId: "$rawMaterialsArr.rawMaterialId",
                    },
                    pipeline: [
                        {
                            $unwind: {
                                path: "$rawMaterialsArr",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$rawMaterialsArr.rawMaterialId", "$$rawMaterialId"],
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalRecieved: {
                                    $sum: "$rawMaterialsArr.receivedQuantity",
                                },
                            },
                        },
                    ],
                    as: "grnObj",
                },
            },
            {
                $unwind: {
                    path: "$grnObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
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
                $addFields: {
                    totalRecieved: {
                        $cond: [
                            {
                                $ifNull: ["$grnObj", null],
                            },
                            "$grnObj.totalRecieved",
                            0,
                        ],
                    },
                },
            },
            {
                $addFields: {
                    quantity: {
                        $subtract: ["$rawMaterialsArr.quantity", "$totalRecieved"],
                    },
                    totalRecieved: 0,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    customerId: {
                        $first: {
                            label: "$customerObj.name",
                            value: "$customerObj._id",
                        },
                    },
                    purchaseOrderNo: {
                        $first: "$purchaseOrderNo",
                    },
                    indentNo: {
                        $first: "$indentNo",
                    },
                    quotationNo: {
                        $first: "$quotationNo",
                    },
                    purchaseOrderDate: {
                        $first: "$purchaseOrderDate",
                    },
                    basicTotal: {
                        $first: "$basicTotal",
                    },
                    cgst: {
                        $first: "$cgst",
                    },
                    sgst: {
                        $first: "$sgst",
                    },
                    igst: {
                        $first: "$igst",
                    },
                    roundOff: {
                        $first: "$roundOff",
                    },
                    totalAmount: {
                        $first: "$totalAmount",
                    },
                    deliveryDate: {
                        $first: "$deliveryDate",
                    },
                    paymentTerms: {
                        $first: "$paymentTerms",
                    },
                    freight: {
                        $first: "$freight",
                    },
                    modeOfDispatch: {
                        $first: "$modeOfDispatch",
                    },
                    dispatchArrangement: {
                        $first: "$dispatchArrangement",
                    },
                    methodOfProductApproval: {
                        $first: "$methodOfProductApproval",
                    },
                    insurance: {
                        $first: "$insurance",
                    },
                    dispatchDestination: {
                        $first: "$dispatchDestination",
                    },
                    note: {
                        $first: "$note",
                    },
                    issuedby: {
                        $first: "$issuedby",
                    },
                    issuedbyDate: {
                        $first: "$issuedbyDate",
                    },
                    verifiedby: {
                        $first: "$verifiedby",
                    },
                    verifiedbyDate: {
                        $first: "$verifiedbyDate",
                    },
                    approvedby: {
                        $first: "$approvedby",
                    },
                    approvedbyDate: {
                        $first: "$approvedbyDate",
                    },
                    distribution: {
                        $first: "$distribution",
                    },
                    retentionPeriod: {
                        $first: "$retentionPeriod",
                    },
                    effectiveDate: {
                        $first: "$effectiveDate",
                    },
                    revNo: {
                        $first: "$revNo",
                    },
                    revDate: {
                        $first: "$revDate",
                    },
                    createdAt: {
                        $first: "$createdAt",
                    },
                    updatedAt: {
                        $first: "$updatedAt",
                    },
                    filesArr: {
                        $first: "$filesArr",
                    },
                    poId: {
                        $first: "$poId",
                    },
                    indentId: {
                        $first: "$indentId",
                    },
                    salesOrderId: {
                        $first: "$salesOrderId",
                    },
                    rawMaterialsArr: {
                        $addToSet: {
                            label: "$rawMaterialObj.name",
                            value: "$rawMaterialObj._id",
                            specification: "$rawMaterialObj.specification",
                            displayName: "$rawmaterialObj.displayName",
                            rawMaterialId: "$rawMaterialsArr.rawMaterialId",
                            quantity: "$quantity",
                            receivedQuantity: "$totalRecieved",
                            unitRate: "$rawMaterialsArr.unitRate",
                            uom: "$rawMaterialsArr.uom",
                            totalAmount: "$rawMaterialsArr.totalAmount",
                        },
                    },
                },
            },
        ];
        console.log(JSON.stringify(pipeline, null, 2));
        let existsCheck = await PurchaseOrder.aggregate(pipeline);
        if (existsCheck && existsCheck.length == 0) {
            throw new Error("PurchaseOrder does not exists");
        }
        res.status(201).json({
            message: "found all PurchaseOrder",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};
export const updatePurchaseOrderById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await PurchaseOrder.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("PurchaseOrder does not exists");
        }

        for (let index = 0; index < req.body.filesArr.length; index++) {
            const element = req.body.filesArr[index];

            if (element.fileUrl && `${element.fileUrl}`.includes("base64")) {
                let fileUrl = await storeFileAndReturnNameBase64(element.fileUrl);
                req.body.filesArr[index].fileUrl = fileUrl;
            }
        }

        if (req.body.salesOrderId) {
            let saleOrderObj = await SalesOrder.findById(req.body.salesOrderId).exec();
            if (saleOrderObj) {
                req.body.salesOrderObj = saleOrderObj;
            }
        }

        if (req.body.customerId) {
            let customerObj = await Customer.findById(req.body.customerId).exec();
            if (customerObj) {
                req.body.customerObj = customerObj;
            }
        }

        if (req.body.indentId) {
            let rawMaterialPurchaseIndentObj = await RawMaterialPurchaseIndent.findById(req.body.indentId).exec();
            if (rawMaterialPurchaseIndentObj) {
                req.body.rawMaterialPurchaseIndentObj = rawMaterialPurchaseIndentObj;
            }
        }

        for (let i = 0; i < req.body.rawMaterialsArr.length; i++) {
            const element = req.body.rawMaterialsArr[i];
            if (element.rawMaterialId) {
                let rawMaterialObj = await RawMaterials.findById(element.rawMaterialId).exec();
                if (rawMaterialObj) {
                    element.rawMaterialObj = rawMaterialObj;
                }
            }
        }

        
        let PurchaseOrderObj = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body).exec();
        // addLogs("Purchase Order updated", PurchaseOrderObj._id, req.body);
        res.status(201).json({ message: "PurchaseOrder Updated" });
    } catch (error) {
        next(error);
    }
};
export const deletePurchaseOrderById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await PurchaseOrder.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("PurchaseOrder does not exists");
        }
        let PurchaseOrderObj = await PurchaseOrder.findByIdAndDelete(req.params.id).exec();
        addLogs("Purchase Order removed", PurchaseOrderObj?._id, PurchaseOrderObj?._id);
        res.status(201).json({ message: "PurchaseOrder Deleted" });
    } catch (error) {
        next(error);
    }
};
