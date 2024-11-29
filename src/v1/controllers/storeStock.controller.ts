import { TRANSACTION } from "@common/constant.common";
import { addLogs } from "@helpers/addLog";
import { paginateAggregate } from "@helpers/paginateAggregate";
import { escapeRegExp } from "@helpers/regex";
import { RawMaterials } from "@models/rawMaterials.model";
import { Store } from "@models/store.model";
import { StoreStock } from "@models/storeStock.model";
import { StoreStockBatchWise } from "@models/storeStockBatchWise.model";
import { User } from "@models/user.model";
import { RequestHandler } from "express";
import mongoose, { Types } from "mongoose";
import XLSX from "xlsx";

export const addStoreStock = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await StoreStock.findOne({
            name: new RegExp(`^${req.body.name}$`, "i"),
        }).exec();
        if (existsCheck) {
            throw new Error("StoreStock already exists");
        }
        await new StoreStock(req.body).save();
        addLogs("StoreStock added", req.body.name, req.body.name);
        res.status(201).json({ message: "StoreStock Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllStocksForParticularStore = async (req: any, res: any, next: any) => {
    try {
        let userObj = await User.findById(req.params.id).lean().exec();

        let matchObj: any = {
            userId: new mongoose.Types.ObjectId(req.params.id),
        };

        if (userObj?.rawMaterialArr && userObj?.rawMaterialArr.length > 0) {
            matchObj = {
                rawmaterialId: {
                    $in: userObj?.rawMaterialArr.map((el) => new mongoose.Types.ObjectId(el.rawMaterialId)),
                },
            };
        }

        let pipeline = [
            {
                $match: matchObj,
            },
        ];
        console.log(JSON.stringify(pipeline, null, 2), "Pipeline");

        let storeStockArr = await paginateAggregate(StoreStock, pipeline, req.query);

        res.status(201).json({
            message: "found all Product Categories",
            data: storeStockArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllStoreStock = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [{ name: new RegExp(req.query.query, "i") }, { safeCoCode: new RegExp(req.query.query, "i") }];
        }
        if (req.query.StoreStockCategoryId && req.query.StoreStockCategoryId != "") {
            matchObj.StoreStockCategoryId = new mongoose.Types.ObjectId(req.query.StoreStockCategoryId);
        }

        pipeline.push(
            {
                $match: matchObj,
            },
            {
                $unwind: {
                    path: "$rawMaterialArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "rawmaterials",
                    localField: "rawMaterialArr.rawMaterialId",
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
                    name: {
                        $first: "$name",
                    },
                    _id: "$_id",
                    StoreStockType: {
                        $first: "$StoreStockType",
                    },
                    rawMaterialsArr: {
                        $addToSet: {
                            label: "$rawMaterialObj.name",
                            value: "$rawMaterialObj._id",
                        },
                    },
                },
            }
        );

        let StoreStockArr = await paginateAggregate(StoreStock, pipeline, req.query);

        res.status(201).json({
            message: "found all Product Categories",
            data: StoreStockArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getAllStoreStockForSelectInput = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        if (req.query.filmType && req.query.filmType != "") {
            matchObj.filmType = new RegExp(`^${req.query.filmType}$`, "i");
        }
        if (req.query.printedType && req.query.printedType != "") {
            matchObj.printedType = new RegExp(`^${req.query.printedType}$`, "i");
        }
        if (req.query.laminationType && req.query.laminationType != "") {
            matchObj.laminationType = new RegExp(`^${req.query.laminationType}$`, "i");
        }
        if (req.query.coatingType && req.query.coatingType != "") {
            matchObj.coatingType = new RegExp(`^${req.query.coatingType}$`, "i");
        }

        pipeline.push({
            $match: matchObj,
        });
        pipeline.push({
            $project: {
                label: "$name",
                value: "$_id",
                _id: 0,
            },
        });

        let StoreStockArr = await StoreStock.aggregate(pipeline);
        res.status(201).json({
            message: "found all Product Categories",
            data: StoreStockArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getStoreStockById = async (req: any, res: any, next: any) => {
    try {
        let pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id),
                },
            },
            {
                $unwind: {
                    path: "$rawMaterialArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "rawmaterials",
                    localField: "rawMaterialArr.rawMaterialId",
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
                    name: {
                        $first: "$name",
                    },
                    _id: "$_id",
                    StoreStockType: {
                        $first: "$StoreStockType",
                    },
                    rawMaterialsArr: {
                        $addToSet: {
                            label: "$rawMaterialObj.name",
                            value: "$rawMaterialObj._id",
                        },
                    },
                },
            },
        ];

        let existsCheck: any = await StoreStock.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Raw Material does not exists");
        }

        // let RawMaterialCategoriesObj = await RawMaterialCategories.findById(existsCheck.rawMaterialCategoryId).exec()
        // if(RawMaterialCategoriesObj){
        //     existsCheck.rawMaterialCategoryId = RawMaterialCategoriesObj
        // }

        res.status(201).json({
            message: "found all StoreStock",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};
export const updateStoreStockById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await StoreStock.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Raw Material does not exists");
        }

        addLogs("Raw Material updated", req.body.name, req.body.name);
        let StoreStockObj = await StoreStock.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Raw Material Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleteStoreStockById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await StoreStock.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Raw Material does not exists");
        }
        let StoreStockObj = await StoreStock.findByIdAndDelete(req.params.id).exec();
        addLogs(" removed", req.body.name, req.body.name);
        res.status(201).json({ message: "Raw Material Deleted" });
    } catch (error) {
        next(error);
    }
};

export const getStoreStockByStoreId: RequestHandler = async (req, res, next) => {
    try {
        let arr = await StoreStock.find({ userId: req.params.storeId }).exec();
        res.status(200).json({ message: "Data", data: arr });
    } catch (error) {
        next(error);
    }
};

export const UploadTodaysStoreStock = async (req: any, res: any, next: any) => {
    try {
        for (let i = 0; i < req.body.rawMaterialsArr.length; i++) {
            const element = req.body.rawMaterialsArr[i];
            console.log("heree1 22");
            let tempRawMaterialObj = await RawMaterials.findById(element.value).lean().exec();
            if (!tempRawMaterialObj) {
                throw new Error(`${element.label} does not exists in the system please contact the concerned deptartment !!!`);
            }
            console.log("heree1 22");
            let storeObj = await Store.findOne({ "rawMaterialArr.rawMaterialId": new Types.ObjectId(element.value) }).exec();

            if (!storeObj) {
                throw new Error(`${tempRawMaterialObj.name} is not alloted to any store, please contact the admin department to allot it.`);
            }

            let userObj = await User.findOne({ storeId: storeObj?._id }).exec();
            if (!userObj) {
                throw new Error(`Store not found or deleted please contact admin for more details.`);
            }
            let stockObj: any = await StoreStock.findOne({ rawmaterialId: tempRawMaterialObj._id }).exec();
            if (!stockObj) {
                stockObj = { stock: 0 };
            }

            let mainStockObj = {
                name: `${tempRawMaterialObj?.name} (${tempRawMaterialObj?.specification})`,
                userId: userObj._id,
                rawmaterialId: tempRawMaterialObj?._id,
                stock: stockObj.stock + (element.transactionType == TRANSACTION.INWARDS ? 1 : -1) * Number(element.stockValue),
                createdAt: new Date(req.body.stockLogDate),
            };

            if(mainStockObj.stock < 0){
                throw new Error(`Stock cannot be less than 0 !!!, we have found that one or more (${mainStockObj.name} or more) of your raw material stocks are going below 0 `)
            }
            console.log("heree1");
            console.log("heree",mainStockObj);
            let updatedStockObj 
            if(!stockObj._id){
                updatedStockObj = await new StoreStock(mainStockObj).save();

            }else{
                updatedStockObj = await StoreStock.findOneAndUpdate({ rawmaterialId: tempRawMaterialObj._id },  mainStockObj , {new: true }).exec();

            }
            console.log(stockObj, "stockObj");
            let batchWiseStockObj = {
                name: `${tempRawMaterialObj?.name} (${tempRawMaterialObj?.specification})`,
                userId: userObj._id,
                rawMaterialId: tempRawMaterialObj?._id,
                transactionType: element.transactionType,
                currentStock: stockObj.stock,
                remainingStock: updatedStockObj?.stock,
                createdAt: new Date(req.body.stockLogDate),
            };
            await new StoreStockBatchWise(batchWiseStockObj).save();
        }

        console.log(req.body, "body,body,body,body,body,body,body,body,body,body,body,body,body,body,body,body,body,body,body,body,body,body,body,body");

        res.status(200).json({ message: "Data" });
    } catch (error) {
        next(error);
    }
};
