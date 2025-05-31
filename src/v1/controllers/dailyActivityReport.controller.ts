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
import { ExportService } from "../../util/excelfile";
import fs from "fs";






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

    export const downloadExcelDailyActivityReport = async (
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        // Determine export type and adjust filename/title accordingly
        const isSelectedExport =
          req.body.tickRows &&
          Array.isArray(req.body.tickRows) &&
          req.body.tickRows.length > 0;
      
        return ExportService.downloadFile(req, res, next, {
          model: DailyActivityReport,
          buildQuery: buildDailyActivityReportQuery,
          formatData: formatDailyActivityReportData,
          processFields: processDailyActivityReportFields,
          filename: isSelectedExport ? "selected_daily_activity_reports" : "daily_activity_reports",
          worksheetName: isSelectedExport ? "Selected Daily Activity Reports" : "Daily Activity Reports",
          title: isSelectedExport ? "Selected Daily Activity Reports" : "Daily Activity Reports",
        });
      };
      
      const buildDailyActivityReportQuery = (req: Request) => {
        const query: any = {};
      
        // Check if specific IDs are selected (tickRows)
        if (
          req.body.tickRows &&
          Array.isArray(req.body.tickRows) &&
          req.body.tickRows.length > 0
        ) {
          // If tickRows is provided, only export selected records
          console.log("Exporting selected rows:", req.body.tickRows.length);
          query._id = { $in: req.body.tickRows };
          return query; // Return early, ignore other filters when exporting selected rows
        }
      
        // If no tickRows, apply regular filters
        console.log("Exporting filtered records");
      
        if (req.body.status) {
          query.status = req.body.status;
        }
      
        if (req.body.dateFrom && req.body.dateTo) {
          query.dateOfVisit = {
            $gte: new Date(req.body.dateFrom),
            $lte: new Date(req.body.dateTo),
          };
        }
      
        // Add other existing filters here
        if (req.body.modeOfMeeting) {
          query.modeOfMeeting = req.body.modeOfMeeting;
        }
      
        if (req.body.companyName) {
          query.companyName = { $regex: req.body.companyName, $options: "i" };
        }
      
        // Add search functionality if needed
        if (req.body.search) {
          query.$or = [
            { companyName: { $regex: req.body.search, $options: "i" } },
            { purposeOfVisit: { $regex: req.body.search, $options: "i" } },
            { 'customerName.label': { $regex: req.body.search, $options: "i" } },
          ];
        }
      
        return query;
      };
      
      const formatDailyActivityReportData = (report: any) => {
        return {
          id: report._id,
          companyName: report.companyName,
          purposeOfVisit: report.purposeOfVisit,
          leadId: report.leadId,
          dateOfVisit: report.dateOfVisit ? new Date(report.dateOfVisit).toLocaleDateString() : '',
          modeOfMeeting: report.modeOfMeeting,
          customerName: report.customerName?.label || '',
          scheduleMeeting: report.scheduleMeeting ? new Date(report.scheduleMeeting).toLocaleString() : '',
          description: report.description,
          status: report.status,
          createdAt: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '',
          updatedAt: report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : '',
        };
      };
      
      const processDailyActivityReportFields = (fields: string[]) => {
        const fieldMapping = {
          id: { key: "id", header: "ID", width: 15 },
          companyName: { key: "companyName", header: "Company Name", width: 30 },
          purposeOfVisit: { key: "purposeOfVisit", header: "Purpose of Visit", width: 30 },
          leadId: { key: "leadId", header: "Lead ID", width: 20 },
          dateOfVisit: { key: "dateOfVisit", header: "Date of Visit", width: 20 },
          modeOfMeeting: { key: "modeOfMeeting", header: "Mode of Meeting", width: 20 },
          customerName: { key: "customerName", header: "Customer Name", width: 25 },
          scheduleMeeting: { key: "scheduleMeeting", header: "Schedule Meeting", width: 25 },
          description: { key: "description", header: "Description", width: 40 },
          status: { key: "status", header: "Status", width: 15 },
          createdAt: { key: "createdAt", header: "Created At", width: 20 },
          updatedAt: { key: "updatedAt", header: "Updated At", width: 20 },
        };
      
        if (fields.length === 0) {
          // Return all fields if none specified
          return Object.values(fieldMapping);
        }
      
        return fields
          .map((field: string) => fieldMapping[field as keyof typeof fieldMapping])
          .filter((item) => Boolean(item));
      };
      
      export const downloadDailyActivityReportTemplate = async (
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        try {
          // Create a new workbook and worksheet
          const workbook = new ExcelJs.Workbook();
          const worksheet = workbook.addWorksheet("Daily Activity Report Template", {
            pageSetup: { paperSize: 9, orientation: "landscape" },
          });
      
          // Define template columns
          worksheet.columns = [
            { header: "Company Name*", key: "companyName", width: 25 },
            { header: "Purpose of Visit*", key: "purposeOfVisit", width: 30 },
            { header: "Lead ID", key: "leadId", width: 20 },
            { header: "Date of Visit*", key: "dateOfVisit", width: 20 },
            { header: "Mode of Meeting*", key: "modeOfMeeting", width: 20 },
            { header: "Customer Name*", key: "customerName", width: 25 },
            { header: "Schedule Meeting", key: "scheduleMeeting", width: 25 },
            { header: "Description", key: "description", width: 40 },
            { header: "Status", key: "status", width: 15 },
          ];
      
          // Style the header row
          const headerRow = worksheet.getRow(1);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
      
          // Add example data
          worksheet.addRow({
            companyName: "ABC Corp",
            purposeOfVisit: "Product demonstration",
            leadId: "65a1bc1e3f4d8e2a1c9e8f7d",
            dateOfVisit: new Date().toISOString().split('T')[0],
            modeOfMeeting: "In-person",
            customerName: "John Doe",
            scheduleMeeting: new Date().toISOString(),
            description: "Discussed product features and pricing",
            status: "Completed",
          });
      
          // Add dropdown validations
          // Mode of Meeting dropdown
          worksheet.getCell("E2").dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: ['"In-person,Phone call,Video conference,Email,Other"'],
          };
      
          // Status dropdown
          worksheet.getCell("I2").dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: ['"Scheduled,Completed,Rescheduled,Cancelled"'],
          };
      
          // Add instructions
          const instructionSheet = workbook.addWorksheet("Instructions");
          instructionSheet.columns = [
            { header: "Field", key: "field", width: 20 },
            { header: "Description", key: "description", width: 50 },
            { header: "Required", key: "required", width: 10 },
          ];
      
          // Style the header row
          const instHeaderRow = instructionSheet.getRow(1);
          instHeaderRow.font = { bold: true };
          instHeaderRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
      
          // Add instructions
          const instructions = [
            {
              field: "Company Name",
              description: "Name of the company visited",
              required: "Yes",
            },
            {
              field: "Purpose of Visit",
              description: "Reason for the visit/meeting",
              required: "Yes",
            },
            {
              field: "Lead ID",
              description: "Associated lead ID if applicable",
              required: "No",
            },
            {
              field: "Date of Visit",
              description: "Date when the visit/meeting occurred (YYYY-MM-DD format)",
              required: "Yes",
            },
            {
              field: "Mode of Meeting",
              description: "How the meeting was conducted (In-person, Phone call, etc.)",
              required: "Yes",
            },
            {
              field: "Customer Name",
              description: "Name of the person met with",
              required: "Yes",
            },
            {
              field: "Schedule Meeting",
              description: "Date and time of scheduled meeting",
              required: "No",
            },
            {
              field: "Description",
              description: "Details about the meeting/visit",
              required: "No",
            },
            {
              field: "Status",
              description: "Current status of the activity",
              required: "No",
            },
          ];
      
          instructions.forEach((instruction) => {
            instructionSheet.addRow(instruction);
          });
      
          // Generate file
          const timestamp = new Date().getTime();
          const filename = `daily_activity_report_template_${timestamp}.xlsx`;
          const directory = path.join("public", "uploads");
      
          // Ensure directory exists
          if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
          }
      
          const filePath = path.join(directory, filename);
          await workbook.xlsx.writeFile(filePath);
      
          res.json({
            status: "success",
            message: "Template downloaded successfully",
            filename: filename,
          });
        } catch (error) {
          console.error("Template download error:", error);
          next(error);
        }
      };









