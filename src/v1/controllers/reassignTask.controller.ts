
import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { ReassignTask} from "@models/reassignTask.model"
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import { Task } from "@models/taskManagement.model";






export const addReassignTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await ReassignTask.findOne({ name: req.body.phone }).exec();
        // if (existsCheck) {
        //     throw new Error("ReassignTask with same email already exists");
        // }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     console.log("first", req.body.imagesArr)
        //     for (const el of req.body.imagesArr) {
        //         if (el.image && el.image !== "") {
        //             el.image = await storeFileAndReturnNameBase64(el.image);
        //         }
        //     }
        // }

        console.log(
            "check 2 ", "for check ReassignTask"
        )
        const reassignTask = await new ReassignTask(req.body).save();
        res.status(201).json({ message: "ReassignTask Created" });


    } catch (error) {
        next(error);
    }
};

export const getAllReassignTask = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let ReassignTaskArr = await paginateAggregate(ReassignTask, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: ReassignTaskArr.data, total: ReassignTaskArr.total });
    } catch (error) {
        next(error);
    }
};

export const getReassignTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await ReassignTask.aggregate(pipeline);
        if (!existsCheck ) {
            throw new Error("ReassignTask does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Contact",
            data: existsCheck,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const updateReassignTaskById = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.params.id, "check request params")
    
    
    try {
        let existsCheck = await Task.findById(req.params.id).lean().exec();


        console.log(existsCheck, "existsCheck");
        if (!existsCheck) {
            throw new Error("ReassignTask does not exists");
        }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     for (const el of req.body.imagesArr) {
        //         if (el.images && el.images !== "" && el.images.includes("base64")) {
        //             el.images = await storeFileAndReturnNameBase64(el.images);
        //         }
        //     }
        // }
        let Obj = await ReassignTask.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "ReassignTask Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteReassignTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await ReassignTask.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("ReassignTask does not exists or already deleted");
        }
        await ReassignTask.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "ReassignTask Deleted" });
    } catch (error) {
        next(error);
    }
};




    








