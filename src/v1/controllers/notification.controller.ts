import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { Category } from "@models/category.model";
import { Vendor } from "@models/vendor.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Hotel } from "@models/hotel.model";
import { Banquet } from "@models/banquet.model";
import { Notification } from "@models/notification.model";

export const addNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }

        console.log(req.body, "check req body");

        await new Notification(req.body).save();
        res.status(201).json({ message: "Notification Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllNotification = async (req: any, res: any, next: any) => {
    try {

        console.log(req.user, "check req user");req.user.userId;
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
    
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let ResturantArr = await paginateAggregate(Notification, pipeline, req.query);
        res.status(201).json({ message: "found all Device", data: ResturantArr.data, total: ResturantArr.total });
    } catch (error) {
        next(error);
    }
};

export const getNotificationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Notification.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Notification does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Notification ",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateNotificationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Notification.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Notification does not exists");
        }

        let Obj = await Notification.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Notification Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteNotificationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Notification.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Notification does not exists or already deleted");
        }
        await Notification.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Resturant Deleted" });
    } catch (error) {
        next(error);
    }
};



export const getNotificationByUserId = async (req: Request, res: Response, next: NextFunction) => {
    console.log("working ")
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj.assignedTo = new mongoose.Types.ObjectId(req.params.userId);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Notification.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Notification does not exists");
        }
       
        res.status(201).json({
            message: "found specific Notification ",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};