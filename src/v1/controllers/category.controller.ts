import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { Category } from "@models/category.model";

export const addCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Category.findOne({ name: req.body.name }).exec();
        if (existsCheck) {
            throw new Error("Category already exists");
        }
        await new Category(req.body).save();
        res.status(201).json({ message: "Category Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllCategory = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let CategoryArr = await paginateAggregate(Category, pipeline, req.query);
        res.status(201).json({ message: "found all Device", data: CategoryArr.data, total: CategoryArr.total });
    } catch (error) {
        next(error);
    }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Category.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Category does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Category",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Category.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Category does not exists");
        }
        let Obj = await Category.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Category Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Category.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Category does not exists or already deleted");
        }
        await Category.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Category Deleted" });
    } catch (error) {
        next(error);
    }
};
