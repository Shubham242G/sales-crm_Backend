import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { deleteFileUsingUrl, storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Enquiry } from "@models/enquiry.model";
import ExcelJs from "exceljs";
import XLSX from "xlsx";
import path from 'path'

import { QuotesFromVendors } from "@models/quotesFromVendors.model"
import { Rfp } from "@models/rfp.model";
import { QuotesToCustomer } from "@models/quotesToCustomer.model";


export const addQuotesFromVendors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }

        console.log(req.body.attachment.includes("base64"), "check attachment")
        for(let i=0; i<req.body.attachment.length; i++) {
        if (req?.body && req?.body?.attachment && req?.body?.attachment.includes("base64")) {
            req.body.attachment = await storeFileAndReturnNameBase64(req.body.attachment);
        }
    }
        const quotesFromVendors = await new QuotesFromVendors(req.body).save();
        res.status(201).json({ message: "Quote From Vendor Created" });






    } catch (error) {
        next(error);
    }
};

export const getAllQuotesFromVendors = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let QuotesFromVendorsArr = await paginateAggregate(QuotesFromVendors, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: QuotesFromVendorsArr.data, total: QuotesFromVendorsArr.total });
    } catch (error) {
        next(error);
    }
};

export const getQuotesFromVendorsById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await QuotesFromVendors.aggregate(pipeline);
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

export const updateQuotesFromVendorsById = async (req: Request, res: Response, next: NextFunction) => {
    try {


  

        let existsCheck = await QuotesFromVendors.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Quote From Vendor does not exists");
        }


        
        if (req?.body && req?.body?.attachment && req?.body?.attachment.length > 0) {

            for(let i=0; i<req.body.attachment.length; i++) {
                if (req?.body && req?.body?.attachment[i] && req?.body?.attachment[i].includes("base64")) {
                    req.body.attachment[i] = await storeFileAndReturnNameBase64(req.body.attachment[i]);
                    await deleteFileUsingUrl(`uploads/${existsCheck?.attachment[i]}`);
                  }
            }

            //   req.body.attachment = await storeFileAndReturnNameBase64(req.body.attachment);
            //   await deleteFileUsingUrl(`uploads/${existsCheck?.attachment}`);
            }
        let Obj = await QuotesFromVendors.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Quote From Vendor Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteQuotesFromVendorsById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await QuotesFromVendors.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Quote from Vendor does not exists or already deleted");
        }
        await QuotesFromVendors.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Quote From Vendor Deleted" });
    } catch (error) {
        next(error);
    }
};


export const BulkUploadQuotesFromVendors: RequestHandler = async (req, res, next) => {
    try {
        let xlsxFile: any = req.file?.path;
        if (!xlsxFile) throw new Error("File Not Found");

        // Read the Excel file
        let workbook = XLSX.readFile(xlsxFile);
        let sheet_nameList = workbook.SheetNames;

        let xlData: any = [];
        sheet_nameList.forEach((element: any) => {
            console.log(element, "check element")
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[element]));
        });

        console.log(xlData, "check xlData")

        // Caching
        // const countryCache = new Map();
        // const stateCache = new Map();
        // const cityCache = new Map();

        // Function to fetch or create records
        const fetchOrCreateRecord = async (model: any, name: any, cache: any, extraData: any = {}) => {
            if (cache.has(name)) return cache.get(name);
            let record = await model.findOne({ name }).lean().exec();
            if (!record) {
                record = await new model({ name, ...extraData }).save();
            }
            cache.set(name, record);
            return record;
        };


        const finalArr: any = [];
        for (let index = 0; index < xlData.length; index++) {
            const row = xlData[index];

            let query: any = {
                _id: row["ID"],
                name: row["Display Name"],
                phone: row["Phone"],
                email: row["Email"],
                typeOfContact: row["Type of Contact"],
            };
            finalArr.push(query);
        }


        console.log(finalArr, "check finalArr")
        if (finalArr.length > 0) {
            await QuotesFromVendors.insertMany(finalArr);

        }

        res.status(200).json({ message: "Bulk upload Enquiry completed successfully", data: finalArr });
    } catch (error) {
        next(error);
    }
};

export const convertQuotesFromVendorToQuotesToCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vendorQuoteId = req.params.id;
  
      const vendorQuote = await QuotesFromVendors.findById(vendorQuoteId).lean().exec();
      if (!vendorQuote) {
        throw new Error("Quote from Vendor does not exist");
      }
  
      
      const updatedMarkupDetails = vendorQuote.markupDetails?.map((item: any) => {
        const baseAmount = parseFloat(vendorQuote.amount || "0");
        const markupPercentage = parseFloat(item.markupAmount || "0");
  
        
        const markupAmount = baseAmount + (baseAmount * (markupPercentage / 100));
  
        return {
          ...item,
          markupAmount: markupAmount.toFixed(2), 
        };
      }) || [];
  
      
      const totalAmount = updatedMarkupDetails.reduce((acc, item) => acc + parseFloat(item.markupAmount), 0).toFixed(2);
  
      const quotesToCustomerData = {
        quotesId: vendorQuote.quotesId,
        serviceType: vendorQuote.serviceType,
        amount: vendorQuote.amount,
        markupDetails: updatedMarkupDetails, 
        totalAmount,
      };
  
      const newQuotesToCustomer = await new QuotesToCustomer(quotesToCustomerData).save();
  
      res.status(201).json({
        message: "Quote from Vendor successfully converted to Quote to Customer",
        data: newQuotesToCustomer,
      });
    } catch (error) {
      next(error);
    }
  };
  
  