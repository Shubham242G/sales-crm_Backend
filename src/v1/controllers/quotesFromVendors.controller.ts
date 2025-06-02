import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { deleteFileUsingUrl, storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Enquiry } from "@models/enquiry.model";
import ExcelJs from "exceljs";
import XLSX from "xlsx";
import path from 'path'


import fs from 'fs';
import { Types } from 'mongoose';

import {ExportService} from '../../util/excelfile';

import { QuotesFromVendors } from "@models/quotesFromVendors.model"
import { Rfp } from "@models/rfp.model";
import { QuotesToCustomer } from "@models/quotesToCustomer.model";
import { ConfirmedQuotesFromVendor } from "@models/confirmedQuotesFromVendor.model";


export const addQuotesFromVendors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Ensure that the attachment is an array
        if (!Array.isArray(req.body.attachment)) {
            throw new Error("Attachment must be an array.");
        }

        // Allowed file types
        const allowedFileTypes = ["pdf", "jpeg", "jpg", "xlsx"];

        for (let i = 0; i < req.body.attachment.length; i++) {
            const attachment = req.body.attachment[i];
            const fileType = attachment.split(';')[0].split('/')[1];

            // Check if the file type is allowed
            if (!allowedFileTypes.includes(fileType)) {
                throw new Error("Unsupported file type. Only PDF, Excel, and JPEG are allowed.");
            }

            if (attachment.includes("base64")) {
                req.body.attachment[i] = await storeFileAndReturnNameBase64(attachment);
            }
        }

        const quotesFromVendors = await new QuotesFromVendors({ ...req.body, status: "Quote received from vendor" }).save();
        res.status(201).json({ message: "Quote From Vendor Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllQuotesFromVendors = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        const { query } = req.query;

        if (req.query.query && typeof req.query.query === 'string' && req.query.query !== "") {
      
            matchObj.$or = [
              { quotesId: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") },
              { rfpId: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") },
              { status: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") },
              { displayName: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") },
              
              // Add any other fields you want to search by
            ];
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

            for (let i = 0; i < req.body.attachment.length; i++) {
                if (req?.body && req?.body?.attachment[i] && req?.body?.attachment[i].includes("base64")) {
                    req.body.attachment[i] = await storeFileAndReturnNameBase64(req.body.attachment[i]);
                    await deleteFileUsingUrl(`uploads/${existsCheck?.attachment[i]}`);
                }
            }

            //   req.body.attachment = await storeFileAndReturnNameBase64(req.body.attachment);
            //   await deleteFileUsingUrl(`uploads/${existsCheck?.attachment}`);
        }

        let Obj = await QuotesFromVendors.findByIdAndUpdate(existsCheck._id, { ...req.body, status: "Under negotitation with vendor" }).exec();



        const rfp = await Rfp.findOne({ enquiryId: existsCheck.enquiryId });



        if (!rfp?._id) {
            throw new Error("RFP does not exist");
        }


        let rfpObj = await Rfp.findByIdAndUpdate(rfp._id, { status: "Under negotitation with vendor" }).exec();
        await rfpObj?.save();

        if (!rfpObj?.enquiryId) {

            throw new Error(" rfpObj Enquiry does not exist");
        }

        const enquiry = await Enquiry.findOne({ _id: rfpObj?.enquiryId });
        if (!enquiry) {
            throw new Error("Enquiry does not exist");
        }


        let enquiryObj = await Enquiry.findByIdAndUpdate(enquiry._id, { status: "Under negotitation with vendor" }).exec();
        await enquiryObj?.save();

        await Obj?.save();
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
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[element]));
        });


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


        if (finalArr.length > 0) {
            await QuotesFromVendors.insertMany(finalArr);

        }

        res.status(200).json({ message: "Bulk upload Enquiry completed successfully", data: finalArr });
    } catch (error) {
        next(error);
    }
};

// export const convertQuotesFromVendorToQuotesToCustomer = async (
//     req: Request,
//     res: Response,
//     next: NextFunction
// ) => {


//     console.log("working ")
//     try {
//         const vendorQuoteId = req.params.id;

//         const vendorQuote = await QuotesFromVendors.findById(vendorQuoteId).lean().exec();
//         if (!vendorQuote) {
//             throw new Error("Quote from Vendor does not exist");
//         }

       


//         const updatedMarkupDetails = vendorQuote.markupDetails?.map((item: any) => {
//             const baseAmount = parseFloat(vendorQuote.amount || "0");
//             const markupPercentage = parseFloat(item.markupAmount || "0");


//             const markupAmount = baseAmount + (baseAmount * (markupPercentage / 100));

//             return {
//                 ...item,
//                 markupAmount: markupAmount.toFixed(2),
//             };
//         }) || [];


//         const totalAmount = updatedMarkupDetails.reduce((acc, item) => acc + parseFloat(item.markupAmount), 0).toFixed(2);

//         const quotesToCustomerData = {
//             quotesId: vendorQuote.quotesId,
//             serviceType: vendorQuote.serviceType,
//             amount: vendorQuote.amount,
//             markupDetails: updatedMarkupDetails,
//             totalAmount,
//             status: "Quote sent to customer",
//             enquiryId: vendorQuote.enquiryId,
//             customerName: "",
//         };

//         if (vendorQuote?.enquiryId && vendorQuote?.enquiryId) {
//             var newQuotesToCustomer = await new QuotesToCustomer(quotesToCustomerData).save();

//             console.log(newQuotesToCustomer, '<---------check newQuotesToCustomer is working ')

//             const result = await Enquiry.findByIdAndUpdate(vendorQuote.enquiryId, { status: "Quote sent to customer" }).exec();

//             console.log(result, 'check result is working ')

//             const result1 = await Rfp.updateOne(
//                 { enquiryId: vendorQuote.enquiryId }, // Find by enquiryId
//                 { $set: { status: "Quote sent to customer", updatedAt: new Date() } } // Update status and timestamp
//             );


//             const result2 = await QuotesFromVendors.updateOne(
//                 { enquiryId: vendorQuote.enquiryId }, // Find by enquiryId
//                 { $set: { status: "Quote sent to customer", updatedAt: new Date() } } // Update status and timestamp
//             );





//             // let quote

//             // if (newQuotesToCustomer) {

//             //     quote = await QuotesFromVendors.findByIdAndUpdate(newQuotesToCustomer._id, { status: "Quote sent to customer" })
//             //     await quote?.save();
//             // }

//             // let rfp = await Rfp.findOne({ enquiryId: quote?.enquiryId }).exec();
//             // if (!rfp?.enquiryId) {
//             //     throw new Error("RFP does not exist");
//             // }

//             // await Rfp.findByIdAndUpdate(rfp.enquiryId, { status: "Quote sent to customer" });
//             // rfp.save();

//             // let enquiry = await Enquiry.findOne({ enquiryId: rfp.enquiryId });

//             // console.log("enquiry------------------->", enquiry);
//             // if (!enquiry?._id) {
//             //     throw new Error("Enquiry does not exist");
//             // }

//             // await Enquiry.findByIdAndUpdate(enquiry._id, { status: "Quote sent to customer" });
//             // enquiry.save();

//             res.status(201).json({
//                 message: "Quote from Vendor successfully converted to Quote to Customer",
//                 data: newQuotesToCustomer,
//             });
//         }
//     } catch (error) {
//         next(error);
//     }
// };

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

        // Check if a quote already exists for this RFP
        const existingQuote = await QuotesToCustomer.findOne({ enquiryId: vendorQuote.enquiryId }).lean().exec();
        if (existingQuote) {
            throw new Error("Quote from Vendors for this RFP already exists.");
        }

        const updatedMarkupDetails = vendorQuote.markupDetails?.map((item: any) => {
            const baseAmount = Number(vendorQuote.amount || 0);
            const markupPercentage = parseFloat(item.markupAmount || "0");

            const markupAmount = baseAmount + (baseAmount * (markupPercentage / 100));

            return {
                ...item,
                markupAmount: markupAmount.toFixed(2),
            };
        }) || [];

        const totalAmount = updatedMarkupDetails.reduce((acc, item) => acc + parseFloat(item.markupAmount), 0).toFixed(2);
        const  enquiry = await Enquiry.findOne({ _id: vendorQuote.enquiryId }).lean().exec();
        const quotesFromVendorData= {
            banquetEventOrders: {
                eventCoordinatorName: "",
                eventDate: new Date(),
                hotelName: "",
                leadId: vendorQuote.leadId,
                eventCoordinatorReportingTime: "",
                clientsCompanyName: "",
                onsiteClientName: "",
                salesPersonName: "",
                expectedPax: "",
                quotesId: vendorQuote.quotesId,
                rfpId: vendorQuote.rfpId,
                displayName: vendorQuote.displayName,
                vendorList: vendorQuote.vendorList,
                serviceType: vendorQuote.serviceType,
                amount: vendorQuote.amount.toString(),
                receivedDate: vendorQuote.receivedDate,
                status: "Quote sent to customer",
                attachment: vendorQuote.attachment
            },
            banquetEventOrdersSecond: {
                eventStartTime: "",
                eventEndTime: "",
                btr: "",
                venueHandoveTime: "",
                welcomeDrinkStartTime: "",
                venueName: "",
                setup: "",
                avVendorName: "",
                avVendorNo: "",
                expNumberOfSeating: "",
                hotelCoordinationName: "",
                hotelCoordinationNo: "",
                linerColor: "",
                startersPlacement: "",
                startersEventTime: ""
            },
            menuSelection: {
                srNo: "",
                veg: "",
                nonVeg: "",
                actions: ""
            },
            eventFlow: {
                srNo: "",
                text1: "",
                text2: "",
                actions: ""
            },
            audioVisual: {
                srNo: "",
                text1: "",
                text2: "",
                actions: ""
            },
            checklist: []
        };

        if (vendorQuote?.enquiryId) {
            var newQuotesToCustomer = await new ConfirmedQuotesFromVendor(quotesFromVendorData).save();


            const result = await Enquiry.findByIdAndUpdate(vendorQuote.enquiryId, { status: "Quote sent to customer" }).exec();


            await Rfp.updateOne(
                { enquiryId: vendorQuote.enquiryId },
                { $set: { status: "Quote sent to customer", updatedAt: new Date() } }
            );

           

            await QuotesFromVendors.updateOne(
                { enquiryId: vendorQuote.enquiryId },
                { $set: { status: "Quote sent to customer", updatedAt: new Date() } }
            );

            res.status(201).json({
                message: "Quote from Vendor successfully converted to Quote to Customer",
                data: newQuotesToCustomer,
            });
        }
    } catch (error) {
        next(error);
    }
};




interface IMarkUpDetails {
  label: string;
  orignalAmount: number;
  markupAmount: number;
}

interface IQuotesFromVendors {
  quotesId: string;
  rfpId: string;
  enquiryId?: Types.ObjectId;
  leadId: Types.ObjectId;
  vendorList: {
    label: string;
    value: string;
  };
  serviceType: [];
  amount: Number;
  receivedDate: string;
  status: string;
  attachment: string[];
  displayName: string;
  eventDates: [
    {
      startDate: Date;
    }
  ];
  markupDetails: IMarkUpDetails[];
  totalMarkupAmount?: number;
}

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
    model: QuotesFromVendors,
    buildQuery: buildQuotesQuery,
    formatData: formatQuotesData,
    processFields: processQuotesFields,
    filename: isSelectedExport ? "selected_vendor_quotes" : "vendor_quotes",
    worksheetName: isSelectedExport ? "Selected Vendor Quotes" : "Vendor Quotes",
    title: isSelectedExport ? "Selected Vendor Quotes" : "Vendor Quotes",
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
    query.receivedDate = {
      $gte: new Date(req.body.dateFrom),
      $lte: new Date(req.body.dateTo),
    };
  }

  // Add other existing filters here
  if (req.body.vendorId) {
    query['vendorList.value'] = req.body.vendorId;
  }

  if (req.body.serviceType) {
    query.serviceType = { $in: req.body.serviceType };
  }

  if (req.body.rfpId) {
    query.rfpId = req.body.rfpId;
  }

  if (req.body.enquiryId) {
    query.enquiryId = req.body.enquiryId;
  }

  // Add search functionality if needed
  if (req.body.search) {
    query.$or = [
      { quotesId: { $regex: req.body.search, $options: "i" } },
      { displayName: { $regex: req.body.search, $options: "i" } },
      { 'vendorList.label': { $regex: req.body.search, $options: "i" } },
    ];
  }

  return query;
};

const formatQuotesData = (quote: IQuotesFromVendors) => {
  return {
    // id: quote._id,
    quotesId: quote.quotesId,
    rfpId: quote.rfpId,
    vendorName: quote.vendorList?.label || '',
    serviceTypes: quote.serviceType?.join(', ') || '',
    amount: quote.amount,
    receivedDate: new Date(quote.receivedDate).toLocaleDateString(),
    status: quote.status,
    displayName: quote.displayName,
    eventStartDate: quote.eventDates?.[0]?.startDate 
      ? new Date(quote.eventDates[0].startDate).toLocaleDateString() 
      : '',
    totalMarkupAmount: quote.totalMarkupAmount || 0,
    markupDetails: quote.markupDetails?.map(detail => 
      `${detail.label}: ${detail.markupAmount}`
    ).join('; ') || '',
    attachmentCount: quote.attachment?.length || 0
  };
};

const processQuotesFields = (fields: string[]) => {
  const fieldMapping = {
    id: { key: "id", header: "ID", width: 15 },
    quotesId: { key: "quotesId", header: "Quote ID", width: 20 },
    rfpId: { key: "rfpId", header: "RFP ID", width: 20 },
    vendorName: { key: "vendorName", header: "Vendor Name", width: 25 },
    serviceTypes: { key: "serviceTypes", header: "Service Types", width: 30 },
    amount: { key: "amount", header: "Amount", width: 15 },
    receivedDate: { key: "receivedDate", header: "Received Date", width: 15 },
    status: { key: "status", header: "Status", width: 15 },
    displayName: { key: "displayName", header: "Display Name", width: 20 },
    eventStartDate: { key: "eventStartDate", header: "Event Start Date", width: 15 },
    totalMarkupAmount: { key: "totalMarkupAmount", header: "Total Markup", width: 15 },
    markupDetails: { key: "markupDetails", header: "Markup Details", width: 30 },
    attachmentCount: { key: "attachmentCount", header: "Attachments Count", width: 15 }
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
    const worksheet = workbook.addWorksheet("Vendor Quotes Template", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Define template columns
    worksheet.columns = [
      { header: "Quote ID*", key: "quotesId", width: 20 },
      { header: "RFP ID*", key: "rfpId", width: 20 },
      { header: "Vendor ID*", key: "vendorId", width: 20 },
      { header: "Vendor Name", key: "vendorName", width: 25 },
      { header: "Service Types", key: "serviceTypes", width: 30 },
      { header: "Amount*", key: "amount", width: 15 },
      { header: "Received Date*", key: "receivedDate", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Display Name", key: "displayName", width: 20 },
      { header: "Event Start Date", key: "eventStartDate", width: 15 }
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
      quotesId: "QUOTE-001",
      rfpId: "RFP-001",
      vendorId: "VENDOR-001",
      vendorName: "ABC Catering",
      serviceTypes: "Catering, Venue",
      amount: 5000,
      receivedDate: new Date().toISOString().split('T')[0],
      status: "Pending",
      displayName: "Wedding Package",
      eventStartDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
    });

    // Add dropdown validations for status
    worksheet.getCell("H2").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Pending,Approved,Rejected,On Hold,Completed"'],
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
      { field: "RFP ID", description: "Related RFP identifier", required: "Yes" },
      { field: "Vendor ID", description: "Vendor identifier", required: "Yes" },
      { field: "Vendor Name", description: "Name of the vendor", required: "No" },
      { field: "Service Types", description: "Comma-separated list of services", required: "No" },
      { field: "Amount", description: "Total quoted amount", required: "Yes" },
      { field: "Received Date", description: "Date quote was received (YYYY-MM-DD)", required: "Yes" },
      {
        field: "Status",
        description: "Current status of the quote (Pending, Approved, Rejected, On Hold, Completed)",
        required: "No",
      },
      {
        field: "Display Name",
        description: "Display name for the quote",
        required: "No",
      },
      {
        field: "Event Start Date",
        description: "Start date of the event (YYYY-MM-DD)",
        required: "No",
      }
    ];

    instructions.forEach((instruction) => {
      instructionSheet.addRow(instruction);
    });

    // Generate file
    const timestamp = new Date().getTime();
    const filename = `vendor_quotes_import_template_${timestamp}.xlsx`;
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