import { Device } from "@models/device.model";
import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";

export const addDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Device.findOne({ name: req.body.name }).exec();
        if (existsCheck) {
            throw new Error("Device already exists");
        }
        await new Device(req.body).save();
        res.status(201).json({ message: "Device Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllDevice = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let DeviceArr = await paginateAggregate(Device, pipeline, req.query);
        res.status(201).json({ message: "found all Device", data: DeviceArr.data, total: DeviceArr.total });
    } catch (error) {
        next(error);
    }
};

export const getDeviceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Device.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Device does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Device",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateDeviceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Device.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Device does not exists");
        }
        let Obj = await Device.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Device Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteDeviceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Device.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Device does not exists or already deleted");
        }
        await Device.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Device Deleted" });
    } catch (error) {
        next(error);
    }
};
