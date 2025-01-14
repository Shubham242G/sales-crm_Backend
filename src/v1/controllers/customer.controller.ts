

import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Customer } from "@models/customer.model";




export const addCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     console.log("first", req.body.imagesArr)
        //     for (const el of req.body.imagesArr) {
        //         if (el.image && el.image !== "") {
        //             el.image = await storeFileAndReturnNameBase64(el.image);
        //         }
        //     }
        // }
        const customer = await new Customer(req.body).save();
        res.status(201).json({ message: "Customer Created" });


    } catch (error) {
        next(error);
    }
};

export const getAllCustomer = async (req: any, res: any, next: any) => {
    console.log("check")
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let CustomerArr = await paginateAggregate(Customer, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: CustomerArr.data, total: CustomerArr.total });
    } catch (error) {
        next(error);
    }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Customer.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Banquet does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Contact",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Customer.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Customer does not exists");
        }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     for (const el of req.body.imagesArr) {
        //         if (el.images && el.images !== "" && el.images.includes("base64")) {
        //             el.images = await storeFileAndReturnNameBase64(el.images);
        //         }
        //     }
        // }
        let Obj = await Customer.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Customer Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Customer.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Lead does not exists or already deleted");
        }
        await Customer.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Lead Deleted" });
    } catch (error) {
        next(error);
    }
};







