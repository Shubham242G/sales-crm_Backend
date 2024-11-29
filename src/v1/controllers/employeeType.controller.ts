import { EmployeeType } from "@models/employeetype.model";
import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";

export const addEmployeeType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await EmployeeType.findOne({ name: req.body.name }).exec();
        if (existsCheck) {
            throw new Error("Employee Type already exists");
        }
        await new EmployeeType(req.body).save();
        res.status(201).json({ message: "Employee Type Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllEmployeeType = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let EmployeeTypeArr = await paginateAggregate(EmployeeType, pipeline, req.query);
        res.status(201).json({ message: "found all Employee Type", data: EmployeeTypeArr.data, total: EmployeeTypeArr.total });
    } catch (error) {
        next(error);
    }
};

export const getEmployeeTypeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await EmployeeType.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Employee Type does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Employee Type",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateEmployeeTypeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await EmployeeType.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Employee Type does not exists");
        }
        let Obj = await EmployeeType.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Employee Type Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteEmployeeTypeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await EmployeeType.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Employee Type does not exists or already deleted");
        }
        await EmployeeType.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Employee Type Deleted" });
    } catch (error) {
        next(error);
    }
};
