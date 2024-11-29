import { Policy } from "@models/policy.model";
import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";

export const addPolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Policy.findOne({ name: req.body.name }).exec();
        if (existsCheck) {
            throw new Error("Policy already exists");
        }
        await new Policy(req.body).save();
        res.status(201).json({ message: "Policy Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllPolicy = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let PolicyArr = await paginateAggregate(Policy, pipeline, req.query);
        res.status(201).json({ message: "found all Policy", data: PolicyArr.data, total: PolicyArr.total });
    } catch (error) {
        next(error);
    }
};

export const getPolicyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Policy.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Policy does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Policy",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updatePolicyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Policy.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Policy does not exists");
        }
        let Obj = await Policy.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Policy Updated" });
    } catch (error) {
        next(error);
    }
};

export const deletePolicyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Policy.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Policy does not exists or already deleted");
        }
        await Policy.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Policy Deleted" });
    } catch (error) {
        next(error);
    }
};
