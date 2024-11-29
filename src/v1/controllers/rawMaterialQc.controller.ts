import { GENERALSTATUS, TRANSACTION } from "@common/constant.common";
import { Customer } from "@models/customer.model";
import { Grn, IGRN } from "@models/grn.model";
import { PurchaseOrder } from "@models/purchaseOrder.model";
import { RawMaterialPurchaseIndent } from "@models/rawMaterialPurchaseIndent.modal";
import { RawMaterialQc } from "@models/rawMaterialQc.model";
import { RawMaterials } from "@models/rawMaterials.model";
import { SalesOrder } from "@models/salesOrder.model";
import { Store } from "@models/store.model";
import { StoreStock } from "@models/storeStock.model";
import { StoreStockBatchWise } from "@models/storeStockBatchWise.model";
import { User } from "@models/user.model";
import mongoose from "mongoose";
export const addRawMaterialQc = async (req: any, res: any, next: any) => {
    try {
        // let existsCheck = await RawMaterialQc.findOne({
        //     salesOrderId: new mongoose.Types.ObjectId(req.body.salesOrderId),
        // }).exec();
        // if (existsCheck) {
        //     throw new Error("Raw Material Qc already exists");
        // }
        console.log(req.body,"req.body")

        let grnObj:IGRN|null|undefined 
        
        
        if (req.body.salesOrderId) {
            let saleOrderObj = await SalesOrder.findById(req.body.salesOrderId).exec();
            if (saleOrderObj) {
                req.body.salesOrderObj = saleOrderObj;
            }
        }

        if (req.body.indentId) {
            let indentObj = await RawMaterialPurchaseIndent.findById(req.body.indentId).exec();
            if (indentObj) {
                req.body.indentObj = indentObj;
            }
        }
        if (req.body.customerId) {
            let indentObj = await Customer.findById(req.body.customerId).exec();
            if (indentObj) {
                req.body.indentObj = indentObj;
            }
        }
        if (req.body.grnId) {
            grnObj = await Grn.findById(req.body.grnId).exec();
            if (grnObj) {
                req.body.grnObj = grnObj;
            }
        }
        if (req.body.poId) {
            let poObj = await PurchaseOrder.findById(req.body.poId).exec();
            if (poObj) {
                req.body.poObj = poObj;
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









        const qcObj = await new RawMaterialQc(req.body).save();

        let requestRawMaterialArr = req.body.rawMaterialsArr;

        let batchWiseStockArr = [];
        for (let i = 0; i < requestRawMaterialArr.length; i++) {
            let tempRawMaterialObj = await RawMaterials.findById(requestRawMaterialArr[i]["rawMaterialId"]).lean().exec();

            if (tempRawMaterialObj) {
                let storeObj = await Store.findOne({ "rawMaterialArr.rawMaterialId": tempRawMaterialObj._id }).exec();

                if (!storeObj?._id) {
                    throw new Error(`${tempRawMaterialObj.name} is not managed by any store please ask admin to assign it to a store to move forward !!!`);
                }
                let userObj = await User.findOne({ storeId: storeObj._id }).exec();
                if (!userObj) {
                    throw new Error(`${storeObj.name} is not assigned to any user please ask admin to assign it to any store user !!!`);
                }
                //  existing stock Check
                let existingStockObj = await StoreStock.findOne({
                    rawmaterialId: tempRawMaterialObj?._id,
                })
                    .lean()
                    .exec();
                if (existingStockObj) {
                    /// updating stock here
                    if (requestRawMaterialArr[i]["okQuantity"] > 0) {
                        await StoreStock.findByIdAndUpdate(existingStockObj._id, {
                            $inc: {
                                stock: requestRawMaterialArr[i]["okQuantity"],
                            },
                        }).exec();

                        let batchWiseStockObj = {
                            name: `${tempRawMaterialObj?.name} (${tempRawMaterialObj?.specification })`,
                            userId: userObj._id,
                            rawMaterialId: tempRawMaterialObj?._id,
                            poId: req.body.salesOrderId,
                            qcId: qcObj?._id,
                            uom: requestRawMaterialArr[i]["uom"],
                            currentStock: requestRawMaterialArr[i]["okQuantity"],
                            remainingStock: requestRawMaterialArr[i]["okQuantity"] + existingStockObj.stock,
                        };
                        batchWiseStockArr.push(batchWiseStockObj);
                    }
                } else {
                    if (requestRawMaterialArr[i]["okQuantity"] > 0) {
                        let mainStockObj = {
                            name: `${tempRawMaterialObj?.name} (${tempRawMaterialObj?.specification })`,
                            userId: userObj._id,
                            rawmaterialId: tempRawMaterialObj?._id,
                            uom: requestRawMaterialArr[i]["uom"],
                            stock: requestRawMaterialArr[i]["okQuantity"],
                        };

                        await new StoreStock(mainStockObj).save();

                        let batchWiseStockObj = {
                            name: `${tempRawMaterialObj?.name} (${tempRawMaterialObj?.specification })`,
                            userId: userObj._id,
                            rawMaterialId: tempRawMaterialObj?._id,
                            poId: req.body.salesOrderId,
                            qcId: qcObj?._id,
                            transactionType: TRANSACTION.CREDIT,
                            uom: requestRawMaterialArr[i]["uom"],
                            currentStock: requestRawMaterialArr[i]["okQuantity"],
                            remainingStock: requestRawMaterialArr[i]["okQuantity"],
                        };
                        batchWiseStockArr.push(batchWiseStockObj);
                    }
                }
            }
        }

        if (batchWiseStockArr.length > 0) {
            await StoreStockBatchWise.insertMany(batchWiseStockArr);
        }


        if(!req.body.rawMaterialsArr.some((el:any) => el.quantity > el.okQuantity)){            
            await Grn.findByIdAndUpdate(req.body.grnId, {
                status: GENERALSTATUS.QCCOMPLETED,
            });
            await PurchaseOrder.findByIdAndUpdate(req.body.poId, { status: GENERALSTATUS.QCCOMPLETED }).exec();
        }
        else{
            await Grn.findByIdAndUpdate(req.body.grnId, {
                status: GENERALSTATUS.QCPARTIAL,
            });
        }

        let pendingGRNArr = await Grn.find({salesOrderId:req.body.salesOrderId, status:GENERALSTATUS.QCPENDING}).exec()

        if(!pendingGRNArr || pendingGRNArr.length == 0){
            console.log("Nothing pending !!!")
            await SalesOrder.findByIdAndUpdate(req.body.salesOrderId, { status: GENERALSTATUS.WORKORDERPENDING }).exec();
        }

        res.status(201).json({ message: "RawMaterialQc Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllRawMaterialQc = async (req: any, res: any, next: any) => {
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
                    customerId: {
                        label: "$customerObj.name",
                        value: "$customerObj._id",
                    },
                    "rawMaterialsArr.label": "$rawMaterialObj.name",
                    "rawMaterialsArr.value": "$rawMaterialObj._id",
                },
            },
            {
                $group: {
                    _id: "$_id",
                    salesOrderId: {
                        $first: "$salesOrderId",
                    },
                    grnId: {
                        $first: "$grnId",
                    },
                    indentId: {
                        $first: "$indentId",
                    },
                    poId: {
                        $first: "$poId",
                    },
                    customerId: {
                        $first: "$customerId",
                    },
                    rawMaterialsArr: {
                        $addToSet: "$rawMaterialsArr",
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
        let RawMaterialQcArr = await RawMaterialQc.aggregate(pipeline);
        res.status(201).json({
            message: "found all RawMaterialQc",
            data: RawMaterialQcArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getRawMaterialQcById = async (req: any, res: any, next: any) => {
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
                    customerId: {
                        label: "$customerObj.name",
                        value: "$customerObj._id",
                    },
                    "rawMaterialsArr.label": "$rawMaterialObj.name",
                    "rawMaterialsArr.value": "$rawMaterialObj._id",
                    "rawMaterialsArr.displayName": "$rawMaterialObj.displayName",
                    "rawMaterialsArr.specification": "$rawMaterialObj.specification",
                },
            },
            {
                $group: {
                    _id: "$_id",
                    salesOrderId: {
                        $first: "$salesOrderId",
                    },
                    grnId: {
                        $first: "$grnId",
                    },
                    indentId: {
                        $first: "$indentId",
                    },
                    poId: {
                        $first: "$poId",
                    },
                    customerId: {
                        $first: "$customerId",
                    },
                    rawMaterialsArr: {
                        $addToSet: "$rawMaterialsArr",
                    },
                },
            },
        ];

        let existsCheck = await RawMaterialQc.aggregate(pipeline);

        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("RawMaterialQc does not exists");
        }
        res.status(201).json({
            message: "found all RawMaterialQc",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};
export const updateRawMaterialQcById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterialQc.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("RawMaterialQc does not exists");
        }

        // addLogs(' updated', , );



        if (req.body.salesOrderId) {
            let saleOrderObj = await SalesOrder.findById(req.body.salesOrderId).exec();
            if (saleOrderObj) {
                req.body.salesOrderObj = saleOrderObj;
            }
        }

        if (req.body.indentId) {
            let indentObj = await RawMaterialPurchaseIndent.findById(req.body.indentId).exec();
            if (indentObj) {
                req.body.indentObj = indentObj;
            }
        }
        if (req.body.customerId) {
            let indentObj = await Customer.findById(req.body.customerId).exec();
            if (indentObj) {
                req.body.indentObj = indentObj;
            }
        }
        if (req.body.grnId) {
            let grnObj = await Grn.findById(req.body.grnId).exec();
            if (grnObj) {
                req.body.grnObj = grnObj;
            }
        }
        if (req.body.poId) {
            let poObj = await PurchaseOrder.findById(req.body.poId).exec();
            if (poObj) {
                req.body.poObj = poObj;
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
        }   if (req.body.salesOrderId) {
            let saleOrderObj = await SalesOrder.findById(req.body.salesOrderId).exec();
            if (saleOrderObj) {
                req.body.salesOrderObj = saleOrderObj;
            }
        }

        if (req.body.indentId) {
            let indentObj = await RawMaterialPurchaseIndent.findById(req.body.indentId).exec();
            if (indentObj) {
                req.body.indentObj = indentObj;
            }
        }
        if (req.body.customerId) {
            let indentObj = await Customer.findById(req.body.customerId).exec();
            if (indentObj) {
                req.body.indentObj = indentObj;
            }
        }
        if (req.body.grnId) {
            let grnObj = await Grn.findById(req.body.grnId).exec();
            if (grnObj) {
                req.body.grnObj = grnObj;
            }
        }
        if (req.body.poId) {
            let poObj = await PurchaseOrder.findById(req.body.poId).exec();
            if (poObj) {
                req.body.poObj = poObj;
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




        let RawMaterialQcObj = await RawMaterialQc.findByIdAndUpdate(req.params.id, req.body).exec();
        let pendingGRNArr = await Grn.find({salesOrderId:req.body.salesOrderId, status:GENERALSTATUS.QCPENDING}).exec()

        if(!pendingGRNArr || pendingGRNArr.length == 0){
            console.log("Nothing pending !!!")
            await SalesOrder.findByIdAndUpdate(req.body.salesOrderId, { status: GENERALSTATUS.WORKORDERPENDING }).exec();
        }
        res.status(201).json({ message: "RawMaterialQc Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleteRawMaterialQcById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterialQc.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("RawMaterialQc does not exists");
        }
        let RawMaterialQcObj = await RawMaterialQc.findByIdAndDelete(req.params.id).exec();
        // addLogs(' removed', , );
        res.status(201).json({ message: "RawMaterialQc Deleted" });
    } catch (error) {
        next(error);
    }
};

