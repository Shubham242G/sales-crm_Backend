

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
        console.log(req.body.documentArray, "checking the document array in controller");
        // if (req?.body?.documentArray && req?.body?.documentArray?.length > 0 && req?.body?.documentArray?.includes("base64"))  {
            
        //     for (let el of req?.body?.documentArray) {
        //         if (el && el !== "") {
        //             console.log(el, "before conversion");
        //             el = await storeFileAndReturnNameBase64(el);
              
        //         }
               
        //     }
        // }

        if (req?.body?.documentArray?.length > 0) {
            req.body.documentArray = await Promise.all(
              req.body.documentArray.map(async (el: any) => {
                if (el && el.includes("base64")) {
                  console.log("el check for store", el);
                  return await storeFileAndReturnNameBase64(el);
                }
                return el; // Return the same value if no update is needed
              })
            );
          }

        console.log(req.body.documentArray, 'checking the document array after conversion');
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
            throw new Error("Customer does not exists");
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

        console.log(req.body.documentArray, "check the document array in updateCustomer"); 
        let existsCheck = await Customer.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Customer does not exists");
        }



        // if (req?.body?.documentArray && req?.body?.documentArray?.length > 0 ) {

        //     console.log(req.body.documentArray, "check the document array inside include statement ")
        //     for (let el of req.body.documentArray) {
        //         if (el && el !== "" && el.includes("base64")) {
        //             console.log("el check for store", el)
        //             el = await storeFileAndReturnNameBase64(el);
        //             console.log("el check after store", el)
        //         }
        //     }
        // }

        if (req?.body?.documentArray?.length > 0) {
            req.body.documentArray = await Promise.all(
              req.body.documentArray.map(async (el: any) => {
                if (el && el.includes("base64")) {
                  console.log("el check for store", el);
                  return await storeFileAndReturnNameBase64(el);
                }
                return el; // Return the same value if no update is needed
              })
            );
          }


        console.log(req.body.documentArray, "check after conversion");
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







