import { Holiday } from "@models/holiday.model";
import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";

export const addHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Holiday.findOne({ name: req.body.name }).exec();
        if (existsCheck) {
            throw new Error("Holiday already exists");
        }
        await new Holiday(req.body).save();
        res.status(201).json({ message: "Holiday Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllHoliday = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        pipeline.push({
            $sort:{
                on:1
            }
        })
        let HolidayArr = await paginateAggregate(Holiday, pipeline, req.query);
        res.status(201).json({ message: "found all Holiday", data: HolidayArr.data, total: HolidayArr.total });
    } catch (error) {
        next(error);
    }
};

export const getHolidayById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Holiday.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Holiday does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Holiday",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateHolidayById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Holiday.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Holiday does not exists");
        }
        let Obj = await Holiday.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Holiday Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteHolidayById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Holiday.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Holiday does not exists or already deleted");
        }
        await Holiday.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Holiday Deleted" });
    } catch (error) {
        next(error);
    }
};
