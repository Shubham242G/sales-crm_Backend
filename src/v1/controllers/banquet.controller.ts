import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { Category } from "@models/category.model";
import { Vendor } from "@models/vendor.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Hotel } from "@models/hotel.model";
import { Banquet } from "@models/banquet.model";

export const addBanquet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }

        if (req.body.imagesArr && req.body.imagesArr.length > 0) {
            console.log("first", req.body.imagesArr)
            for (const el of req.body.imagesArr) {
                if (el.image && el.image !== "") {
                    el.image = await storeFileAndReturnNameBase64(el.image);
                }
            }
        }
        await new Banquet(req.body).save();
        res.status(201).json({ message: "Banquet Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllBanquet = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let BanquetArr = await paginateAggregate(Banquet, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: BanquetArr.data, total: BanquetArr.total });
    } catch (error) {
        next(error);
    }
};

export const getBanquetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Banquet.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Banquet does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Banquet",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateBanquetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Banquet.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Banquet does not exists");
        }

        if (req.body.imagesArr && req.body.imagesArr.length > 0) {
            for (const el of req.body.imagesArr) {
                if (el.images && el.images !== "" && el.images.includes("base64")) {
                    el.images = await storeFileAndReturnNameBase64(el.images);
                }
            }
        }
        let Obj = await Banquet.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Banquet Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteBanquetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Banquet.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Banquet does not exists or already deleted");
        }
        await Banquet.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Banquet Deleted" });
    } catch (error) {
        next(error);
    }
};
