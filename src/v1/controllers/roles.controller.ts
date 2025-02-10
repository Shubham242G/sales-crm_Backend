
import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Roles} from "@models/roles.model"
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import { User } from "@models/user.model";






export const addroles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await roles.findOne({ name: req.body.phone }).exec();
        // if (existsCheck) {
        //     throw new Error("roles with same email already exists");
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
            "check 2 ", "for check roles"
        )
        const roles = await new Roles(req.body).save();
        res.status(201).json({ message: "roles Created" });


    } catch (error) {
        next(error);
    }
};

export const getAllroles = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let rolesArr = await paginateAggregate(Roles, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: rolesArr.data, total: rolesArr.total });
    } catch (error) {
        next(error);
    }
};

export const getrolesById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Roles.aggregate(pipeline);
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

export const updaterolesById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Roles.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("roles does not exists");
        }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     for (const el of req.body.imagesArr) {
        //         if (el.images && el.images !== "" && el.images.includes("base64")) {
        //             el.images = await storeFileAndReturnNameBase64(el.images);
        //         }
        //     }
        // }
        let Obj = await Roles.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "roles Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleterolesById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Roles.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("roles does not exists or already deleted");
        }
        await Roles.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "roles Deleted" });
    } catch (error) {
        next(error);
    }
};



export const getrolesByUser = async (req: Request, res: Response, next: NextFunction) => {
    try {


        const user= await User.findById(req.params.id).exec();



        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });

        let checkRoles = await Roles.findOne({ role: user?.role}).exec();

        console.log()
        let existsCheck = await Roles.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Roles does not exists");
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



    








