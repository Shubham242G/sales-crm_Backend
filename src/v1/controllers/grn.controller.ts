import { paginateAggregate } from "@helpers/paginateAggregate";
import { RawMaterialCategories } from "@models/rawMaterialCategories.model";
import { addLogs } from "@helpers/addLog";
import mongoose from "mongoose";
import { Grn } from "@models/grn.model";
import { PurchaseOrder } from "@models/purchaseOrder.model";
import { GENERALSTATUS } from "@common/constant.common";
import { generatePPCNumber } from "@helpers/generators";
import { SalesOrder } from "@models/salesOrder.model";
import { RawMaterialPurchaseIndent } from "@models/rawMaterialPurchaseIndent.modal";
import { Customer } from "@models/customer.model";
import { RawMaterials } from "@models/rawMaterials.model";

export const addGrn = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Grn.findOne({
            grnNo: req.body.grnNo,
        }).exec();
        if (existsCheck) {
            throw new Error("GRN already exists");
        }

        let lastGrnObj = await Grn.findOne({}).sort({ createdAt: -1 }).exec();
        let lastSequence = 1;

        if (lastGrnObj?.grnNo) {
            lastSequence = Number(lastGrnObj?.grnNo.split("/")[1]);
            lastSequence = lastSequence + 1;
        }

        req.body.grnNo = generatePPCNumber("GRN/", lastSequence);

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

        await new Grn(req.body).save();

        let grnByPoIdArr = [
            {
                $match: {
                    poId: new mongoose.Types.ObjectId(req.body.poId),
                },
            },
            {
                $unwind: {
                    path: "$rawMaterialsArr",
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $lookup: {
                    from: "purchaseorders",
                    localField: "poId",
                    foreignField: "_id",
                    let: {
                        rawMaterialId: "$rawMaterialsArr.rawMaterialId",
                    },
                    pipeline: [
                        {
                            $unwind: {
                                path: "$rawMaterialsArr",
                                preserveNullAndEmptyArrays: false,
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
                            $project: {
                                quantity: "$rawMaterialsArr.quantity",
                            },
                        },
                    ],
                    as: "poObj",
                },
            },
            {
                $unwind: {
                    path: "$poObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$rawMaterialsArr.rawMaterialId",
                    invoiceQuantity: {
                        $first: "$poObj.quantity",
                    },
                    receivedQuantity: {
                        $sum: "$rawMaterialsArr.receivedQuantity",
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    pendingQuantity: {
                        $subtract: ["$invoiceQuantity", "$receivedQuantity"],
                    },
                },
            },
            {
                $match: {
                    pendingQuantity: {
                        $gt: 0,
                    },
                },
            },
        ];

        let grnArr = await Grn.aggregate(grnByPoIdArr);

        if (grnArr.every((el) => el.invoiceQuantity <= el.receivedQuantity)) {
            await PurchaseOrder.findByIdAndUpdate(req.body.poId, { status: GENERALSTATUS.GRNCREATED }).exec();
            await SalesOrder.findByIdAndUpdate(req.body.salesOrderId, { status: GENERALSTATUS.GRNCREATED }).exec();
            await RawMaterialPurchaseIndent.findByIdAndUpdate(req.body.indentId, { status: GENERALSTATUS.GRNCREATED }).exec();
        }

        addLogs("GRN  added", req.body.grnNo, req.body.grnNo);
        res.status(201).json({ message: "GRN Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllGrn = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [{ invoiceNo: new RegExp(req.query.query, "i") }, { grnNo: new RegExp(req.query.query, "i") }];
        }

        pipeline.push(
            {
                $match: matchObj,
            },
            {
                $sort: {
                    createdAt: -1,
                },
            }
        );

        let GrnArr = await paginateAggregate(Grn, pipeline, req.query);

        res.status(201).json({
            message: "found all Grn Categories",
            data: GrnArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getGrnById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck: any = await Grn.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("GRN  does not exists");
        }

        let pipeline = [];

        if (req.query.getClient) {
            pipeline.push(
                {
                    $lookup:
                        /**
                         * from: The target collection.
                         * localField: The local join field.
                         * foreignField: The target join field.
                         * as: The name for the results.
                         * pipeline: Optional pipeline to run on the foreign collection.
                         * let: Optional variables to use in the pipeline field stages.
                         */
                        {
                            from: "purchaseorders",
                            localField: "poId",
                            foreignField: "_id",
                            pipeline: [
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
                                    $group: {
                                        _id: "$_id",
                                        customerObj: {
                                            $first: "$customerObj",
                                        },
                                        indentId: {
                                            $first: "$indentId",
                                        },
                                        deliveryDate: {
                                            $first: "$deliveryDate",
                                        },
                                        salesOrderId: {
                                            $first: "$salesOrderId",
                                        },
                                    },
                                },
                            ],
                            as: "poObj",
                        },
                },
                {
                    $unwind:
                        /**
                         * path: Path to the array field.
                         * includeArrayIndex: Optional name for index.
                         * preserveNullAndEmptyArrays: Optional
                         *   toggle to unwind null and empty values.
                         */
                        {
                            path: "$poObj",
                            preserveNullAndEmptyArrays: true,
                        },
                },
                {
                    $addFields:
                        /**
                         * newField: The new field name.
                         * expression: The new field expression.
                         */
                        {
                            customerObj: "$poObj.customerObj",
                            deliveryDate: "$poObj.deliveryDate",
                        },
                }
            );
        }

        pipeline.push(
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id),
                },
            },
            {
                '$lookup': {
                  'from': 'rawmaterialqcs', 
                  'localField': '_id', 
                  'foreignField': 'grnId', 
                  'pipeline': [
                    {
                      '$unwind': {
                        'path': '$rawMaterialsArr', 
                        'preserveNullAndEmptyArrays': true
                      }
                    }, {
                      '$group': {
                        '_id': '$rawMaterialsArr.rawMaterialId', 
                        'okQuantity': {
                          '$sum': '$rawMaterialsArr.okQuantity'
                        }
                      }
                    }
                  ], 
                  'as': 'rawMaterialQcObj'
                }
              }, {
                '$unwind': {
                  'path': '$rawwMaterialsArr', 
                  'preserveNullAndEmptyArrays': true
                }
              }, {
                '$unwind': {
                  'path': '$rawMaterialsArr', 
                  'preserveNullAndEmptyArrays': true
                }
              }, {
                '$lookup': {
                  'from': 'rawmaterials', 
                  'localField': 'rawMaterialsArr.rawMaterialId', 
                  'foreignField': '_id', 
                  'as': 'rawmaterialObj'
                }
              }, {
                '$unwind': {
                  'path': '$rawmaterialObj', 
                  'preserveNullAndEmptyArrays': false
                }
              }, {
                '$addFields': {
                  'rawMaterialsArr.label': '$rawmaterialObj.name', 
                  'rawMaterialsArr.value': '$rawmaterialObj._id', 
                  'rawMaterialsArr.specification': '$rawmaterialObj.specification', 
                  'rawMaterialsArr.displayName': '$rawmaterialObj.displayName', 
                  'rawMaterialsArr.parametersArr': '$rawmaterialObj.parametersArr', 
                  'rawMaterialsArr.receivedQuantity': '$rawMaterialsArr.receivedQuantity', 
                  'okQuantity': {
                    '$sum': {
                      '$map': {
                        'input': {
                          '$filter': {
                            'input': '$rawMaterialQcObj', 
                            'as': 'rawMaterial', 
                            'cond': {
                              '$eq': [
                                '$$rawMaterial._id', '$rawMaterialsArr.rawMaterialId'
                              ]
                            }
                          }
                        }, 
                        'as': 'filteredMaterial', 
                        'in': '$$filteredMaterial.okQuantity'
                      }
                    }
                  }
                }
              }, {
                '$addFields': {
                  'rawMaterialsArr.receivedQuantity': {
                    '$subtract': [
                      '$rawMaterialsArr.receivedQuantity', '$okQuantity'
                    ]
                  }
                }
              }, {
                '$group': {
                  '_id': '$_id', 
                  'grnNo': {
                    '$first': '$grnNo'
                  }, 
                  'poId': {
                    '$first': '$poId'
                  }, 
                  'salesOrderId': {
                    '$first': '$salesOrderId'
                  }, 
                  'indentId': {
                    '$first': '$indentId'
                  }, 
                  'poNo': {
                    '$first': '$poNo'
                  }, 
                  'invoiceNo': {
                    '$first': '$invoiceNo'
                  }, 
                  'grnDate': {
                    '$first': '$grnDate'
                  }, 
                  'invoiceDate': {
                    '$first': '$invoiceDate'
                  }, 
                  'supplier': {
                    '$first': '$supplier'
                  }, 
                  'remark': {
                    '$first': '$remark'
                  }, 
                  'storeIncharge': {
                    '$first': '$storeIncharge'
                  }, 
                  'relatedDepartment': {
                    '$first': '$relatedDepartment'
                  }, 
                  'departmentHead': {
                    '$first': '$departmentHead'
                  }, 
                  'managinghead': {
                    '$first': '$managinghead'
                  }, 
                  'createdAt': {
                    '$first': '$createdAt'
                  }, 
                  'updateAt': {
                    '$first': '$updateAt'
                  }, 
                  'customerObj': {
                    '$first': '$customerObj'
                  }, 
                  'deliveryDate': {
                    '$first': '$deliveryDate'
                  }, 
                  'rawMaterialsArr': {
                    '$addToSet': '$rawMaterialsArr'
                  }
                }
              }, {
                '$addFields': {
                  'rawMaterialsArr': {
                    '$filter': {
                      'input': '$rawMaterialsArr', 
                      'as': 'rawMaterial', 
                      'cond': {
                        '$gt': [
                          '$$rawMaterial.receivedQuantity', 0
                        ]
                      }
                    }
                  }
                }
              }
        );

        console.log(JSON.stringify(pipeline, null, 2), "pipeline");
        let GrnObj = await Grn.aggregate(pipeline);
        if (GrnObj && GrnObj.length > 0) {
            GrnObj = GrnObj[0];
        }
        res.status(201).json({
            message: "found single GRN",
            data: GrnObj,
        });
    } catch (error) {
        next(error);
    }
};

export const updateGrnById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Grn.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Grn does not exists");
        }

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
        addLogs("Raw Material updated", req.body.name, req.body.name);
        let grnObj = await Grn.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Grn Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteGrnById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Grn.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Grn does not exists");
        }
        let grnObj = await Grn.findByIdAndDelete(req.params.id).exec();
        addLogs(" removed", req.body.name, req.body.name);
        res.status(201).json({ message: "Grn Deleted" });
    } catch (error) {
        next(error);
    }
};
