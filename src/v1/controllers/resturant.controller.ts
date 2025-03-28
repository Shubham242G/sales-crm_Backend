import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { Category } from "@models/category.model";
import { Vendor } from "@models/vendor.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Hotel } from "@models/hotel.model";
import { Banquet } from "@models/banquet.model";
import { Resturant } from "@models/resturant.model";

export const addResturant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }

        if(req.body.imagesArr && req.body.imagesArr.length > 0){
            for(const el of req.body.imagesArr){
                if (el.image && el.image !== "") {
                    el.image = await storeFileAndReturnNameBase64(el.image);
                }
            }
          }
        await new Resturant(req.body).save();
        res.status(201).json({ message: "Resturant Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllResturant = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let ResturantArr = await paginateAggregate(Resturant, pipeline, req.query);
        res.status(201).json({ message: "found all Device", data: ResturantArr.data, total: ResturantArr.total });
    } catch (error) {
        next(error);
    }
};

export const getResturantById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Resturant.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Resturant does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Resturant",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateResturantById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Resturant.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Resturant does not exists");
        }

        if(req.body.imagesArr && req.body.imagesArr.length > 0){
            for(const el of req.body.imagesArr){
                if(el.images && el.images !== "" && el.images.includes("base64")){
                  el.images = await storeFileAndReturnNameBase64(el.images);
                }  
            }
          }
        let Obj = await Resturant.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Resturant Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteResturantById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Resturant.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Resturant does not exists or already deleted");
        }
        await Resturant.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Resturant Deleted" });
    } catch (error) {
        next(error);
    }
};
