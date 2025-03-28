import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { Category } from "@models/category.model";
import { Vendor } from "@models/vendor.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Hotel } from "@models/hotel.model";

export const addHotel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Hotel.findOne({ name: req.body.name }).exec();
        if (existsCheck) {
            throw new Error("Hotel with same name already exists");
        }

        if(req.body.imagesArr && req.body.imagesArr.length > 0){
            for(const el of req.body.imagesArr){
                if (el.image && el.image !== "") {
                    el.image = await storeFileAndReturnNameBase64(el.image);
                }
            }
          }
        await new Hotel(req.body).save();
        res.status(201).json({ message: "Hotel Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllHotel = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        // if (req.query.query && req.query.query != "") {
        //     matchObj.name = new RegExp(req.query.query, "i");
        // }
        pipeline.push({
            $match: matchObj,
        });

        let HotelArr = await paginateAggregate(Hotel, pipeline, req.query);
        res.status(201).json({ message: "found all Hotel", data: HotelArr.data, total: HotelArr.total });
    } catch (error) {
        next(error);
    }
};

export const getHotelById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Hotel.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Hotel does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Hotel",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateHotelById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Hotel.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Hotel does not exists");
        }

        if(req.body.imagesArr && req.body.imagesArr.length > 0){
            for(const el of req.body.imagesArr){
                if(el.images && el.images !== "" && el.images.includes("base64")){
                  el.images = await storeFileAndReturnNameBase64(el.images);
                }  
            }
          }
        let Obj = await Hotel.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "hotel Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteHotelById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Hotel.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Hotel does not exists or already deleted");
        }
        await Hotel.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "hotel Deleted" });
    } catch (error) {
        next(error);
    }
};
