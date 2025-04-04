import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { deleteFileUsingUrl, storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Enquiry } from "@models/enquiry.model";
import ExcelJs from "exceljs";
import XLSX from "xlsx";
import path from 'path'

import { QuotesToCustomer } from "@models/quotesToCustomer.model"
import { Rfp } from "@models/rfp.model";
import { QuotesFromVendors } from "@models/quotesFromVendors.model";


export const addQuotesToCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }

        // console.log(req.body.attachment.includes("base64"), "check attachment")
    //     for(let i=0; i<req.body.attachment.length; i++) {
    //     if (req?.body && req?.body?.attachment && req?.body?.attachment.includes("base64")) {
    //         req.body.attachment = await storeFileAndReturnNameBase64(req.body.attachment);
    //     }
    // }
        const quotesToCustomer = await new QuotesToCustomer({...req.body, status: "Quote sent to customer"}).save();
        res.status(201).json({ message: "Quote From Vendor Created" });






    } catch (error) {
        next(error);
    }
};

export const getAllQuotesToCustomer = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let QuotesToCustomerArr = await paginateAggregate(QuotesToCustomer, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: QuotesToCustomerArr.data, total: QuotesToCustomerArr.total });
    } catch (error) {
        next(error);
    }
};

export const getQuotesToCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await QuotesToCustomer.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Quote From Vendor does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Quote From Vendor",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateQuotesToCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {


  

        let existsCheck = await QuotesToCustomer.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Quote From Vendor does not exists");
        }




        
        // if (req?.body && req?.body?.attachment && req?.body?.attachment.length > 0) {

        //     for(let i=0; i<req.body.attachment.length; i++) {
        //         if (req?.body && req?.body?.attachment[i] && req?.body?.attachment[i].includes("base64")) {
        //             req.body.attachment[i] = await storeFileAndReturnNameBase64(req.body.attachment[i]);
        //             await deleteFileUsingUrl(`uploads/${existsCheck?.attachment[i]}`);
        //           }
        //     }

        //     //   req.body.attachment = await storeFileAndReturnNameBase64(req.body.attachment);
        //     //   await deleteFileUsingUrl(`uploads/${existsCheck?.attachment}`);
        //     }
        let Obj = await QuotesToCustomer.findByIdAndUpdate(req.params.id, { ...req.body, status: "Under negotiation with client" }).exec();
        await Obj?.save();

        let quotesFromVendorsObj = await QuotesFromVendors.findOne({ enquiryId: existsCheck.enquiryId }).exec();
        if (!quotesFromVendorsObj?._id) {
            throw new Error("RFP does not exist")
        }    
        await QuotesFromVendors.findByIdAndUpdate(quotesFromVendorsObj._id, { status: "Under negotiation with client" }).exec();
        await quotesFromVendorsObj?.save();
        
        

        let rfpObj = await Rfp.findOne({ enquiryId: quotesFromVendorsObj.enquiryId }).exec();
        if (!rfpObj?._id) {    
            throw new Error("RFP does not exist");
        }
        await Rfp.findByIdAndUpdate(rfpObj._id, { status: "Under negotiation with client" }).exec();
        await rfpObj?.save();  
         
        let enquiryObj = await Enquiry.findByIdAndUpdate(rfpObj.enquiryId, { status: "Under negotiation with client" }).exec();
        await enquiryObj?.save();

        res.status(201).json({ message: "Quote From Vendor Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteQuotesToCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await QuotesToCustomer.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Quote from Vendor does not exists or already deleted");
        }
        await QuotesToCustomer.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Quote From Vendor Deleted" });
    } catch (error) {
        next(error);
    }
};


