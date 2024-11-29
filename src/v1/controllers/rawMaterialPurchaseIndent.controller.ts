import { DEPARTMENT, RAW_MATERIAL_CATEGORY_TYPE, ROLES, SALE_ORDER_STATUS, SERIES_FOR_TYPE } from "@common/constant.common";
import { REQUEST_TYPES } from "@common/request.common";
import { addApprovalRequest } from "@helpers/addApprovalRequest";
import { RawMaterialPurchaseIndent } from "@models/rawMaterialPurchaseIndent.modal";
import { SalesOrder } from "@models/salesOrder.model";
import { User } from "@models/user.model";
import mongoose from "mongoose";
import { rawMaterialPurchaseIndentByIdPipeline } from "../../builders/rawMaterialPurchaseIndent.builder";
import { getNewValueForSeries } from "../../util/series";
import { Customer } from "@models/customer.model";
import { RawMaterials } from "@models/rawMaterials.model";

interface IgroupedRawMaterial {
    categoryMaterialType: SERIES_FOR_TYPE;
    rawMaterialsArr: any[];
}

export const addrawMaterialPurchaseIndent = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterialPurchaseIndent.findOne({
            salesOrderId: new mongoose.Types.ObjectId(req.body.salesOrderId),
        }).exec();
        if (existsCheck) {
            throw new Error("Raw Material Purchase Indent already exists for this sale order");
        }
        let sequence = 1;
        let existingSequenceArr = await RawMaterialPurchaseIndent.find({}).sort({ createdAt: -1 }).limit(1).exec();
        if (existingSequenceArr.length > 0) {
            if (existingSequenceArr[0]?.ppcSequence) {
                sequence = existingSequenceArr[0]?.ppcSequence + 1;
            } else {
                sequence = 1;
            }
        }

        if (!req.body.rawMaterialsArr || req.body.rawMaterialsArr.length == 0) {
            throw new Error("Please select atleast one raw material !!!");
        }

        let inhouseArr = req.body.rawMaterialsArr.filter((el: any) => el.materialType == RAW_MATERIAL_CATEGORY_TYPE.INHOUSE);

        let purchasedArr = req.body.rawMaterialsArr.filter((el: any) => el.materialType == RAW_MATERIAL_CATEGORY_TYPE.PURCHASED);

        if (purchasedArr && purchasedArr.length > 0) {
            /////////grouping purchased array with respect to categoryMaterialType field
            let groupedPuchaseArr: IgroupedRawMaterial[] = [];

            for (let i = 0; i < purchasedArr.length; i++) {
                const element = purchasedArr[i];
                let groupedIndex = groupedPuchaseArr.findIndex((ele) => ele.categoryMaterialType == element.categoryMaterialType);
                if (groupedIndex !== -1) {
                    groupedPuchaseArr[groupedIndex].rawMaterialsArr.push(element);
                } else {
                    groupedPuchaseArr.push({ categoryMaterialType: element.categoryMaterialType, rawMaterialsArr: [{ ...element }] });
                }
            }

            for (let i = 0; i < groupedPuchaseArr.length; i++) {
                const element = groupedPuchaseArr[i];
                console.log(element, "element");
                let submitObj = { ...req.body };
                submitObj.ppcString = await getNewValueForSeries(element.categoryMaterialType, "INDENT");
                submitObj.rawMaterialsArr = element.rawMaterialsArr;

                if (req.body.salesOrderId) {
                    let saleOrderObj = await SalesOrder.findById(req.body.salesOrderId).exec();
                    if (saleOrderObj) {
                        submitObj.salesOrderObj = saleOrderObj;
                    }
                }

                if (req.body.customerId) {
                    let customerObj = await Customer.findById(req.body.customerId).exec();
                    if (customerObj) {
                        submitObj.customerObj = customerObj;
                    }
                }
                for (let j = 0; j < submitObj.rawMaterialsArr.length; j++) {
                    const rawMaterialElement = submitObj.rawMaterialsArr[j];

                    if (rawMaterialElement.rawMaterialId) {
                        let rawMaterialObj = await RawMaterials.findById(rawMaterialElement.rawMaterialId).exec();
                        if (rawMaterialObj) {
                            rawMaterialElement.rawMaterialObj = rawMaterialObj;
                        }
                    }
                }

                let rawMaterialPurchaseIndentObj = await new RawMaterialPurchaseIndent(submitObj).save();

                ///////////////////approval module starts here
                let usersArr = await User.find({
                    role: {
                        $in: [ROLES.MANAGEMENT, ROLES.MANAGER, ROLES.STOREINCHARGE],
                    },
                    department: {
                        $in: [DEPARTMENT.STORES],
                    },
                }).exec();

                let previousDataPipeline = rawMaterialPurchaseIndentByIdPipeline(String(rawMaterialPurchaseIndentObj?._id));
                let previousDataObj = await RawMaterialPurchaseIndent.aggregate(previousDataPipeline);

                if (previousDataObj && previousDataObj.length > 0) {
                    previousDataObj = previousDataObj[0];
                }

                await addApprovalRequest(
                    RawMaterialPurchaseIndent,
                    rawMaterialPurchaseIndentObj?._id,
                    req.user.userObj,
                    REQUEST_TYPES.RAW_MATERIAL_PURCHASE_INDENT.ADD,
                    previousDataObj,
                    usersArr.map((el) => ({ name: el.name, approverId: el._id, approvalStatus: el._id == req.user.userId })),
                    undefined,
                    undefined,
                    `New Raw material puchase indent added by ${req?.user?.userObj?.name}`
                );
                ///////////////approval module ends here
            }
        }

        await SalesOrder.findByIdAndUpdate(req.body.salesOrderId, { status: SALE_ORDER_STATUS.PURCHASEINTENTCREATED }).exec();

        res.status(201).json({ message: "Raw Material Purchase Indent Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllrawMaterialPurchaseIndent = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        let pageValue = req.query.pageIndex ? parseInt(`${req.query.pageIndex}`) : 0;
        let limitValue = req.query.pageSize ? parseInt(`${req.query.pageSize}`) : 1000;
        pipeline.push(
            {
                $match: matchObj,
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
                    "rawMaterialsArr.name": "$rawMaterialObj.name",
                },
            },
            {
                $group: {
                    _id: "$_id",
                    salesOrderId: {
                        $first: "$salesOrderId",
                    },
                    customerId: {
                        $first: "$customerId",
                    },
                    customerObj: {
                        $first: {
                            name: "$customerObj.name",
                            _id: "$customerObj._id",
                        },
                    },
                    finalDate: {
                        $first: "$finalDate",
                    },
                    approvalPending: {
                        $first: "$approvalPending",
                    },
                    status: {
                        $first: "$status",
                    },
                    rawMaterialsArr: {
                        $addToSet: "$rawMaterialsArr",
                    },
                },
            },
            {
                $sort: {
                    finalDate: 1,
                    createdAt: 1,
                },
            },
            {
                $skip: pageValue * limitValue,
            },
            {
                $limit: limitValue,
            }
        );
        let rawMaterialPurchaseIndentArr = await RawMaterialPurchaseIndent.aggregate(pipeline);
        res.status(201).json({
            message: "found all Raw Material Purchase Indent",
            data: rawMaterialPurchaseIndentArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getrawMaterialPurchaseIndentById = async (req: any, res: any, next: any) => {
    try {
        let pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id),
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
                    "rawMaterialsArr.name": { $concat: ["$rawMaterialObj.name", " (", "$rawMaterialObj.specification", ")"] },
                    "rawMaterialsArr.uom": "$rawMaterialsArr.unit",
                },
            },
            {
                $group: {
                    _id: "$_id",
                    salesOrderId: {
                        $first: "$salesOrderId",
                    },
                    customerId: {
                        $first: "$customerId",
                    },
                    ppcString: {
                        $first: "$ppcString",
                    },
                    ppcSequence: {
                        $first: "$ppcSequence",
                    },
                    customerObj: {
                        $first: {
                            name: "$customerObj.name",
                            _id: "$customerObj._id",
                        },
                    },
                    finalDate: {
                        $first: "$finalDate",
                    },
                    status: {
                        $first: "$status",
                    },
                    rawMaterialsArr: {
                        $addToSet: "$rawMaterialsArr",
                    },
                },
            },
        ];

        let existsCheck = await RawMaterialPurchaseIndent.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Raw Material Purchase Indent does not exists");
        }
        res.status(201).json({
            message: "found all Raw Material Purchase Indent",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};
export const updaterawMaterialPurchaseIndentById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterialPurchaseIndent.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Raw Material Purchase Indent does not exists");
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

        for (let i = 0; i < req.body.rawMaterialsArr.length; i++) {
            const element = req.body.rawMaterialsArr[i];
            if (element.rawMaterialId) {
                let rawMaterialObj = await RawMaterials.findById(element.rawMaterialId).exec();
                if (rawMaterialObj) {
                    element.rawMaterialObj = rawMaterialObj;
                }
            }
        }

        let rawMaterialPurchaseIndentObj = await RawMaterialPurchaseIndent.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Raw Material Purchase Indent Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleterawMaterialPurchaseIndentById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterialPurchaseIndent.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Raw Material Purchase Indent does not exists");
        }
        let rawMaterialPurchaseIndentObj = await RawMaterialPurchaseIndent.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Raw Material Purchase Indent Deleted" });
    } catch (error) {
        next(error);
    }
};
