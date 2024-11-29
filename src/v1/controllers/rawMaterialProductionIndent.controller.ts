import { RawMaterialProductionIndent } from "../../models/rawMaterialProductionIndent.modal";
import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";

export const addRawMaterialProductionIndent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await RawMaterialProductionIndent.findOne({ name: req.body.name }).exec();
        if (existsCheck) {
            throw new Error("Raw Material Production Indent already exists");
        }
        await new RawMaterialProductionIndent(req.body).save();
        res.status(201).json({ message: "Raw Material Production Indent Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllRawMaterialProductionIndent = async (req: any, res: any, next: any) => {
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
                },
            },
            {
                $skip: pageValue * limitValue,
            },
            {
                $limit: limitValue,
            }
        );
        let RawMaterialProductionIndentArr = await RawMaterialProductionIndent.aggregate(pipeline);
        res.status(201).json({
            message: "found all Raw Material Production Indent",
            data: RawMaterialProductionIndentArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
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
                    "rawMaterialsArr.name": "$rawMaterialObj.name",
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

        let existsCheck = await RawMaterialProductionIndent.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Raw Material Production Indent does not exists");
        }
        res.status(201).json({
            message: "found all Raw Material Production Indent",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};

export const updateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await RawMaterialProductionIndent.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Raw Material Production Indent does not exists");
        }
        let Obj = await RawMaterialProductionIndent.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Raw Material Production Indent Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await RawMaterialProductionIndent.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Raw Material Production Indent does not exists or already deleted");
        }
        // await RawMaterialProductionIndent.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Raw Material Production Indent Deleted" });
    } catch (error) {
        next(error);
    }
};
export const getRawMaterialProductionIndentForSelectInput = async (req: Request, res: Response, next: NextFunction) => {
    try {


        let pipeline = [
            {
              '$lookup': {
                'from': 'customers', 
                'localField': 'customerId', 
                'foreignField': '_id', 
                'as': 'customerObj'
              }
            }, {
              '$unwind': {
                'path': '$customerObj', 
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
                'as': 'rawMaterialObj'
              }
            }, {
              '$unwind': {
                'path': '$rawMaterialObj', 
                'preserveNullAndEmptyArrays': true
              }
            }, {
              '$addFields': {
                'dateString': {
                  '$dateToString': {
                    'date': '$createdAt', 
                    'format': '%Y-%m-%d'
                  }
                }
              }
            }, {
              '$addFields': {
                'label': {
                  '$concat': [
                    '$customerObj.name', ' ', 'on', ' ', '(', '$dateString', ')'
                  ]
                }
              }
            }, {
              '$group': {
                '_id': '$_id', 
                'label': {
                  '$first': '$label'
                }, 
                'value': {
                  '$first': '$_id'
                }
              }
            }, {
              '$project': {
                '_id': 0
              }
            }
          ]
        let existsCheck = await RawMaterialProductionIndent.aggregate(pipeline);
        // if (!existsCheck) {
        //     throw new Error("Raw Material Production Indent does not exists or already deleted");
        // }
        // // await RawMaterialProductionIndent.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Raw Material Production Indent List", data:existsCheck });
    } catch (error) {
        next(error);
    }
};
