import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { deleteFileUsingUrl, storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Enquiry } from "@models/enquiry.model";
import {ExportService} from '../../util/excelfile';
import ExcelJs from "exceljs";
import XLSX from "xlsx";
import fs from 'fs';
import path from 'path'

import { QuotesToCustomer } from "@models/quotesToCustomer.model"
import { Rfp } from "@models/rfp.model";
import { QuotesFromVendors } from "@models/quotesFromVendors.model";
import { ConfirmedQuotes } from "@models/confirmedQuotesFromVendor.model";


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

        const { query } = req.query;
        // Handle basic search - search across multiple fields
        if (
          req.query.query &&
          typeof req.query.query === "string" &&
          req.query.query !== ""
        ) {
          matchObj.$or = [
            {
              displayName: {
                $regex: new RegExp(
                  `${typeof req?.query?.query === "string" ? req.query.query : ""}`,
                  "i"
                ),
              },
            },
    
       
            {
              customerName: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            {
              quotesId: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            {
              status: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
    
            
            //check for fullName
          ];
          
           pipeline.push({
          $addFields: {
            fullName: { $concat: ["$firstName", " ", "$lastName"] },
          },
        });
        }
    
        // Handle advanced search (same as before)
        if (req?.query?.advancedSearch && req.query.advancedSearch !== "") {
          const searchParams =
            typeof req.query.advancedSearch === "string"
              ? req.query.advancedSearch.split(",")
              : [];
    
          const advancedSearchConditions: any[] = [];
    
          searchParams.forEach((param: string) => {
            const [field, condition, value] = param.split(":");
    
            if (field && condition && value) {
              let fieldCondition: Record<string, any> = {};
    
              switch (condition) {
                case "contains":
                  fieldCondition[field] = { $regex: value, $options: "i" };
                  break;
                case "equals":
                  fieldCondition[field] = value;
                  break;
                case "startsWith":
                  fieldCondition[field] = { $regex: `^${value}`, $options: "i" };
                  break;
                case "endsWith":
                  fieldCondition[field] = { $regex: `${value}$`, $options: "i" };
                  break;
                case "greaterThan":
                  fieldCondition[field] = {
                    $gt: isNaN(Number(value)) ? value : Number(value),
                  };
                  break;
                case "lessThan":
                  fieldCondition[field] = {
                    $lt: isNaN(Number(value)) ? value : Number(value),
                  };
                  break;
                default:
                  fieldCondition[field] = { $regex: value, $options: "i" };
              }
    
              advancedSearchConditions.push(fieldCondition);
            }
          });
    
          // If we have both basic and advanced search, we need to combine them
          if (matchObj.$or) {
            // If there are already $or conditions (from basic search)
            // We need to use $and to combine with advanced search
            matchObj = {
              $and: [{ $or: matchObj.$or }, { $and: advancedSearchConditions }],
            };
          } else {
            // If there's only advanced search, use $and directly
            matchObj.$and = advancedSearchConditions;
          }
        }
    
        // Add the match stage to the pipeline
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

export const downloadExcelQuotes = async (
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
      model: QuotesToCustomer,
      buildQuery: buildQuotesQuery,
      formatData: formatQuotesData,
      processFields: processQuotesFields,
      filename: isSelectedExport ? "selected_quotes" : "quotes",
      worksheetName: isSelectedExport ? "Selected Quotes" : "Quotes",
      title: isSelectedExport ? "Selected Quotes" : "Quotes",
    });
  };
  
  const buildQuotesQuery = (req: Request) => {
    const query: any = {};
  
    // Check if specific IDs are selected (tickRows)
    if (
      req.body.tickRows &&
      Array.isArray(req.body.tickRows) &&
      req.body.tickRows.length > 0
    ) {
      // If tickRows is provided, only export selected records
      console.log("Exporting selected quotes:", req.body.tickRows.length);
      query._id = { $in: req.body.tickRows };
      return query; // Return early, ignore other filters when exporting selected rows
    }
  
    // If no tickRows, apply regular filters
    console.log("Exporting filtered quotes");
  
    if (req.body.status) {
      query.status = req.body.status;
    }
  
    if (req.body.dateFrom && req.body.dateTo) {
      query.createdAt = {
        $gte: new Date(req.body.dateFrom),
        $lte: new Date(req.body.dateTo),
      };
    }
  
    // Add other existing filters here
    if (req.body.customerName) {
      query.customerName = { $regex: req.body.customerName, $options: "i" };
    }
  
    if (req.body.serviceType && req.body.serviceType.length > 0) {
      query.serviceType = { $in: req.body.serviceType };
    }
  
    // Add amount range filter if needed
    if (req.body.amountFrom || req.body.amountTo) {
      query.amount = {};
      if (req.body.amountFrom) query.amount.$gte = Number(req.body.amountFrom);
      if (req.body.amountTo) query.amount.$lte = Number(req.body.amountTo);
    }
  
    return query;
  };
  
  const formatQuotesData = (quote: any) => {
    return {
      id: quote._id,
      quotesId: quote.quotesId,
      leadId: quote.leadId,
      customerName: quote.customerName,
      enquiryId: quote.enquiryId,
      serviceType: quote.serviceType.join(', '), // Convert array to comma-separated string
      amount: quote.amount,
      status: quote.status,
      displayName: quote.displayName,
      markupDetails: quote.markupDetails.map((md:any) => `${md.label}: ${md.markupAmount}`).join('; '),
      totalMarkupAmount: quote.totalMarkupAmount,
      createdAt: quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : '',
      updatedAt: quote.updatedAt ? new Date(quote.updatedAt).toLocaleDateString() : ''
    };
  };
  
  const processQuotesFields = (fields: string[]) => {
    const fieldMapping = {
      id: { key: "id", header: "ID", width: 15 },
      quotesId: { key: "quotesId", header: "Quote ID", width: 20 },
      customerName: { key: "customerName", header: "Customer Name", width: 30 },
      serviceType: { key: "serviceType", header: "Service Type", width: 30 },
      amount: { key: "amount", header: "Amount", width: 15 },
      status: { key: "status", header: "Status", width: 15 },
      displayName: { key: "displayName", header: "Display Name", width: 20 },
      markupDetails: { key: "markupDetails", header: "Markup Details", width: 40 },
      totalMarkupAmount: { key: "totalMarkupAmount", header: "Total Markup", width: 15 },
      createdAt: { key: "createdAt", header: "Created At", width: 20 },
      updatedAt: { key: "updatedAt", header: "Updated At", width: 20 }
    };
  
    if (fields.length === 0) {
      // Return all fields if none specified
      return Object.values(fieldMapping);
    }
  
    return fields
      .map((field: string) => fieldMapping[field as keyof typeof fieldMapping])
      .filter((item) => Boolean(item));
  };
  
  export const downloadQuotesTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Quotes Template", {
        pageSetup: { paperSize: 9, orientation: "landscape" },
      });
  
      // Define template columns
      worksheet.columns = [
        { header: "Quote ID*", key: "quotesId", width: 20 },
        { header: "Customer Name*", key: "customerName", width: 30 },
        { header: "Service Type*", key: "serviceType", width: 30 },
        { header: "Amount*", key: "amount", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Display Name", key: "displayName", width: 20 },
        { header: "Markup Details (Label:Amount;)", key: "markupDetails", width: 40 },
        { header: "Total Markup Amount", key: "totalMarkupAmount", width: 15 }
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
        quotesId: "QT-12345",
        customerName: "John Doe",
        serviceType: "Service A, Service B",
        amount: 1000,
        status: "Draft",
        displayName: "Quote for John",
        markupDetails: "Setup:100; Maintenance:50",
        totalMarkupAmount: "150"
      });
  
      // Add dropdown validations for status
      worksheet.getCell("E2").dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Draft,Sent,Accepted,Rejected,Expired"'],
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
          field: "Quote ID",
          description: "Unique identifier for the quote",
          required: "Yes",
        },
        {
          field: "Customer Name",
          description: "Name of the customer receiving the quote",
          required: "Yes",
        },
        {
          field: "Service Type",
          description: "Comma-separated list of services included in the quote",
          required: "Yes",
        },
        {
          field: "Amount",
          description: "Total amount for the quote (before markup)",
          required: "Yes",
        },
        {
          field: "Status",
          description: "Current status of the quote (Draft, Sent, Accepted, Rejected, Expired)",
          required: "No",
        },
        {
          field: "Display Name",
          description: "Display name for the quote",
          required: "No",
        },
        {
          field: "Markup Details",
          description: "Semicolon-separated list of markup items (Label:Amount)",
          required: "No",
        },
        {
          field: "Total Markup Amount",
          description: "Sum of all markup amounts",
          required: "No",
        }
      ];
  
      instructions.forEach((instruction) => {
        instructionSheet.addRow(instruction);
      });
  
      // Generate file
      const timestamp = new Date().getTime();
      const filename = `quotes_import_template_${timestamp}.xlsx`;
      const directory = path.join("public", "uploads");
  
      // Ensure directory exists
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
  
      const filePath = path.join(directory, filename);
      await workbook.xlsx.writeFile(filePath);
  
      res.json({
        status: "success",
        message: "Quotes template downloaded successfully",
        filename: filename,
      });
    } catch (error) {
      console.error("Quotes template download error:", error);
      next(error);
    }
  };


// export const convertQuoteToConfirmedQuote = async (req: Request, res: Response) => {
//     const { quoteId } = req.params;
  
//     if (!quoteId || !mongoose.Types.ObjectId.isValid(quoteId)) {
//       return res.status(400).json({ error: "Invalid or missing quoteId" });
//     }
  
//     try {
      
//       const customerQuote = await QuotesToCustomer.findById(quoteId);
//       if (!customerQuote) {
//         return res.status(404).json({ error: "Customer quote not found" });
//       }

// //       import { model, Model, Schema, Types } from "mongoose";


// // const confirmedQuotesSchema = new Schema<IConfirmedQuotes>(
// //   {
// //     banquetEventOrders: {
// //         eventCoordinatorName: String,
// //         eventDate: Date,
// //         hotelName: String,
// //         eventCoordinatorReportingTime: String,
// //         clientsCompanyName: String,
// //         onsiteClientName: String,
// //         salesPersonName: String,
// //         expectedPax: String,
// //         quotesId: String,
// //         rfpId: String,
// //         displayName: String,
// //         vendorList: {
// //             label: String,
// //             value: String
// //         },
// //         amount: String,
// //         serviceType: [],
// //         receivedDate: String,
// //         status: String,
// //         attachment: [String],
// //       },
    
// //       banquetEventOrdersSecond: {
// //         eventStartTime: String,
// //         eventEndTime: String,
// //         btr: String,
// //         venueHandoveTime: String,
// //         welcomeDrinkStartTime: String,
// //         venueName: String,
// //         setup: String,
// //         avVendorName: String,
// //         avVendorNo: String,
// //         expNumberOfSeating: String,
// //         hotelCoordinationName: String,
// //         hotelCoordinationNo: String,
// //         linerColor: String,
// //         startersPlacement: String,
// //         startersEventTime: String,
// //       },
    
// //       menuSelection: {
// //         srNo: [String],
// //         veg: String,
// //         nonVeg: String,
// //         actions: String,
// //       },
    
// //       eventFlow: {
// //         srNo: [String],
// //         text1: String,
// //         text2: String,
// //         actions: String,
// //       },
    
// //       audioVisual: {
// //         srNo: [String],
// //         text1: String,
// //         text2: String,
// //         actions: String,
// //       },
    
// //       checklist: [
// //         {
// //           srNo: [String],
// //           checks: [String],
// //           actions: [String],
// //         },
// //       ],
// //   },
// //   { timestamps: true }
// // );

  
      
//       const confirmedQuote = new ConfirmedQuotes({
//         banquetEventOrders: {
//           eventCoordinatorName: customerQuote.eventCoordinatorName,
//           eventDate: customerQuote.eventDate,
//           hotelName: customerQuote.hotelName,
//           leadId: customerQuote.leadId,
//           eventCoordinatorReportingTime: customerQuote.eventCoordinatorReportingTime,
//           clientsCompanyName: customerQuote.clientsCompanyName,
//           onsiteClientName: customerQuote.onsiteClientName,
//           salesPersonName: customerQuote.salesPersonName,
//           expectedPax: customerQuote.expectedPax,
//           quotesId: customerQuote._id.toString(),
//           rfpId: customerQuote.rfpId,
//           displayName: customerQuote.displayName,
//           vendorList: customerQuote.vendorList,
//           amount: customerQuote.amount,
//           serviceType: customerQuote.serviceType,
//           receivedDate: customerQuote.receivedDate,
//           status: customerQuote.status,
//           attachment: customerQuote.attachment,
//         },
//         banquetEventOrdersSecond: customerQuote.banquetEventOrdersSecond,
//         menuSelection: customerQuote.menuSelection,
//         eventFlow: customerQuote.eventFlow,
//         audioVisual: customerQuote.audioVisual,
//         checklist: customerQuote.checklist,
//       });
  
//       await confirmedQuote.save();
  
//       res.status(201).json({
//         message: "Quote successfully converted to confirmed quote",
//         confirmedQuote,
//       });
//     } catch (error) {
//       console.error("Error converting quote to confirmed quote:", error);
//       res.status(500).json({ error: "Server error", details: error });
//     }
//   };
  


