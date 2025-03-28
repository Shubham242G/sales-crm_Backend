import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { DailyActivityReport } from "@models/dailyActivityReport.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import XLSX from "xlsx";
import path from 'path'
import ExcelJs from "exceljs";






export const addDailyActivityReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await DailyActivityReport.findOne({ name: req.body.phone }).exec();
        // if (existsCheck) {
        //     throw new Error("DailyActivityReport with same email already exists");
        // }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     console.log("first", req.body.imagesArr)
        //     for (const el of req.body.imagesArr) {
        //         if (el.image && el.image !== "") {
        //             el.image = await storeFileAndReturnNameBase64(el.image);
        //         }
        //     }
        // }

        
        const dailyActivityReport = await new DailyActivityReport(req.body).save();
        res.status(201).json({ message: "DailyActivityReport Created" });


    } catch (error) {
        next(error);
        
    }
};

export const getAllDailyActivityReport = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let DailyActivityReportArr = await paginateAggregate(DailyActivityReport, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: DailyActivityReportArr.data, total: DailyActivityReportArr.total });
    } catch (error) {
        next(error);
    }
};

export const getDailyActivityReportById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await DailyActivityReport.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Daily Activity Report does not exists");
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

export const updateDailyActivityReportById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await DailyActivityReport.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("DailyActivityReport does not exists");
        }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     for (const el of req.body.imagesArr) {
        //         if (el.images && el.images !== "" && el.images.includes("base64")) {
        //             el.images = await storeFileAndReturnNameBase64(el.images);
        //         }
        //     }
        // }
        let Obj = await DailyActivityReport.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "DailyActivityReport Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteDailyActivityReportById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await DailyActivityReport.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("DailyActivityReport does not exists or already deleted");
        }
        await DailyActivityReport.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "DailyActivityReport Deleted" });
    } catch (error) {
        next(error);
    }
};


//  export const convertToEnquiry = async (req: Request, res: Response, next: NextFunction) => {
//         // try {
//         //     let existsCheck = await SalesContact.findOne({ firstName: req.body.first,  lastName: req.body.last, companyName: req.body.company }).exec();
//         //     if (existsCheck) {
//         //         throw new Error("Contact with same name already exists");
//         //     }

      

//         try{
//             const dailyActivityReport = await DailyActivityReport.findById(req.params.id).exec();
//             if (!dailyActivityReport) {
//                 throw new Error("DailyActivityReport not found");
//         }
    
//             // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
//             //     console.log("first", req.body.imagesArr)
//             //     for (const el of req.body.imagesArr) {
//             //         if (el.image && el.image !== "") {
//             //             el.image = await storeFileAndReturnNameBase64(el.image);
//             //         }
//             //     }
//             // }


         
//             const existingContact = await SalesContact.findOne({ dailyActivityReportId: req.params.id}).exec();
//             if (existingContact) {
//                 throw new Error("A contact already exists for this dailyActivityReport.");
//               }

  

//             if (dailyActivityReport) {
    
    
//                     const salesContact = new SalesContact({
//                         firstName: dailyActivityReport.firstName, 
//                         lastName: dailyActivityReport.lastName,
//                         phone: dailyActivityReport.phone,
//                         email: dailyActivityReport.email,
//                         company: dailyActivityReport.company,
//                         salutation: dailyActivityReport.salutation,
//                         dailyActivityReportId: dailyActivityReport._id,
                        
//                     });
    
//                     await salesContact.save();
    
//                     res.status(200).json({ message: "Contact conversion completed successfully", data: salesContact }); }
    
             
    
    
          
    
//             res.status(500).json({ message: "Something Went Wrong", });
    
    
    
//         } catch (error) {
//             next(error);
//         };
//     }

    export const BulkUploadDailyActivityReport: RequestHandler = async (req, res, next) => {
    
    
        try {
            let xlsxFile: any = req.file?.path;
            if (!xlsxFile) throw new Error("File Not Found");
    
            // Read the Excel file
            let workbook = XLSX.readFile(xlsxFile);
            let sheet_nameList = workbook.SheetNames;
    
            let xlData: any = [];
            sheet_nameList.forEach((element: any) => {
     
                xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[element]));
            });
    
            if(xlData && xlData.length > 0) {
                xlData.map(async (el: any) => await new DailyActivityReport(el).save())
            }
            res.status(200).json({ message: "File Uploaded Successfully" });
  
        } catch (error) {
            next(error);
        }
    }









