import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Lead } from "@models/lead.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import XLSX from "xlsx";
import path from 'path'
import ExcelJs from "exceljs";


import fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as csv from 'fast-csv';
import { createObjectCsvWriter } from 'csv-writer';
import { Contact } from "@models/contact.model";









export const addLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let existsCheck = await Lead.findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] }).exec();
    if (existsCheck) {
      throw new Error("Lead with same  email  and phone already exists");
    }

    // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
    //     console.log("first", req.body.imagesArr)
    //     for (const el of req.body.imagesArr) {
    //         if (el.image && el.image !== "") {
    //             el.image = await storeFileAndReturnNameBase64(el.image);
    //         }
    //     }
    // }


    const lead = await new Lead(req.body).save();
    res.status(201).json({ message: "Lead Created" });


  } catch (error) {
    next(error);
  }
};



export const getAllLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};

    const { query } = req.query;
    // Handle basic search - search across multiple fields
    if (req.query.query && typeof req.query.query === 'string' && req.query.query !== "") {

      matchObj.$or = [

        { firstName: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") },
        { lastName: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") },
        { email: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") },
        { company: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") },
        { phone: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") },
        { ownerName: new RegExp(typeof req?.query?.query === "string" ? req.query.query : "", "i") }
        // Add any other fields you want to search by
      ];
    }

    // Handle advanced search (same as before)
    if (req?.query?.advancedSearch && req.query.advancedSearch !== "") {
      const searchParams = typeof req.query.advancedSearch === 'string' ? req.query.advancedSearch.split(',') : [];

      const advancedSearchConditions: any[] = [];

      searchParams.forEach((param: string) => {
        const [field, condition, value] = param.split(':');

        if (field && condition && value) {
          let fieldCondition: Record<string, any> = {};

          switch (condition) {
            case 'contains':
              fieldCondition[field] = { $regex: value, $options: 'i' };
              break;
            case 'equals':
              fieldCondition[field] = value;
              break;
            case 'startsWith':
              fieldCondition[field] = { $regex: `^${value}`, $options: 'i' };
              break;
            case 'endsWith':
              fieldCondition[field] = { $regex: `${value}$`, $options: 'i' };
              break;
            case 'greaterThan':
              fieldCondition[field] = { $gt: isNaN(Number(value)) ? value : Number(value) };
              break;
            case 'lessThan':
              fieldCondition[field] = { $lt: isNaN(Number(value)) ? value : Number(value) };
              break;
            default:
              fieldCondition[field] = { $regex: value, $options: 'i' };
          }

          advancedSearchConditions.push(fieldCondition);
        }
      });

      // If we have both basic and advanced search, we need to combine them
      if (matchObj.$or) {
        // If there are already $or conditions (from basic search)
        // We need to use $and to combine with advanced search
        matchObj = {

          $and: [
            { $or: matchObj.$or },
            { $and: advancedSearchConditions }
          ]
        };
      } else {
        // If there's only advanced search, use $and directly
        matchObj.$and = advancedSearchConditions;
      }
    }

    // Add the match stage to the pipeline
    pipeline.push({
      $match: matchObj
    });

    // Handle request for select input options
    if (req?.query?.isForSelectInput) {
      pipeline.push({
        $project: {
          label: { $concat: ["$firstName", " ", "$lastName"] },
          value: "$_id"
        },
      });
    }

    // Use your existing pagination function
    let LeadArr = await paginateAggregate(Lead, pipeline, req.query);

    res.status(201).json({
      message: "found all leads",
      data: LeadArr.data,
      total: LeadArr.total
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};
    if (req.params.id) {
      matchObj._id = new mongoose.Types.ObjectId(req.params.id);
    }
    pipeline.push({
      $match: matchObj,
    });
    let existsCheck = await Lead.aggregate(pipeline);
    if (!existsCheck || existsCheck.length == 0) {
      throw new Error("Lead does not exists");
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

export const updateLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let existsCheck = await Lead.findById(req.params.id).lean().exec();
    if (!existsCheck) {
      throw new Error("Lead does not exists");
    }

    // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
    //     for (const el of req.body.imagesArr) {
    //         if (el.images && el.images !== "" && el.images.includes("base64")) {
    //             el.images = await storeFileAndReturnNameBase64(el.images);
    //         }
    //     }
    // }
    let Obj = await Lead.findByIdAndUpdate(req.params.id, req.body).exec();
    res.status(201).json({ message: "Lead Updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let existsCheck = await Lead.findById(req.params.id).exec();
    if (!existsCheck) {
      throw new Error("Lead does not exists or already deleted");
    }
    await Lead.findByIdAndDelete(req.params.id).exec();
    res.status(201).json({ message: "Lead Deleted" });
  } catch (error) {
    next(error);
  }
};


export const convertToContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existingContact = await Contact.findOne({ leadId: req.params.id }).exec();
    if (existingContact) {
      throw new Error("A contact already exists for this lead.");
    }

    // console.log(req.params.id,

    //   "check params id lead"

    // )


    const lead = await Lead.findById(req.params.id).exec();
    if (!lead) {
      throw new Error("Lead not found");
    }

    // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
    //     console.log("first", req.body.imagesArr)
    //     for (const el of req.body.imagesArr) {
    //         if (el.image && el.image !== "") {
    //             el.image = await storeFileAndReturnNameBase64(el.image);
    //         }
    //     }
    // }







    if (lead) {


      const contact = new Contact({
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phone,
        email: lead.email,
        companyName: lead.company,
        salutation: lead.salutation,
        leadId: lead._id,
        displayName: lead.displayName,
      });

      await contact.save();
      const id = contact._id;
      res.status(200).json({ message: "Contact conversion completed successfully", data: { contact, id } });
    }
  } catch (error) {
    next(error);
  }
}

export const convertToEnquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await Lead.findById(req.params.id).exec();
    if (!lead) {
      throw new Error("Lead not found");
    }

    const existingEnquiry = await Enquiry.findOne({ leadId: req.params.id }).exec();
    if (existingEnquiry) {
      throw new Error("An enquiry already exists for this lead.");
    }

    if (lead) {
      const enquiry = new Enquiry({
        firstName: lead.firstName,
        lastName: lead.lastName,
        phoneNumber: lead.phone,
        email: lead.email,
        companyName: lead.company,
        salutation: lead.salutation,
        leadId: lead._id,
        displayName: lead.displayName,
        leadOwner: lead.leadOwner,
      });

      const newEnquiry = await enquiry.save();

      console.log("newEnquiry", newEnquiry)
      const id = newEnquiry._id;
      res.status(200).json({ message: "Contact conversion completed successfully", data: { lead, id } });
    }

    res.status(500).json({ message: "Something Went Wrong", });



  } catch (error) {
    next(error);
  };
}



export const BulkUploadLead: RequestHandler = async (req, res, next) => {



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

    if (xlData && xlData.length > 0) {
      xlData.map(async (el: any) => await new Lead(el).save())
    }
    res.status(200).json({ message: "File Uploaded Successfully" });

  } catch (error) {
    next(error);
  }
}




export const getAllLeadName = async (req: any, res: any, next: any) => {
  try {
    let leads = await Lead.find(
      {},
      { firstName: 1, lastName: 1, _id: 0 }
    ).lean();


    let leadNames = leads.map((v: any) => ({
      fullName: `${v.firstName} ${v.lastName}`.trim(),
    }));


    res.status(200).json({
      message: "Found all leads names",
      data: leadNames,
      total: leadNames.length,
    });
  } catch (error) {

    next(error);
  }

};




// export const downloadExcelLead = async (req: Request, res: Response, next: NextFunction) => {
//   try {


//       // Create a new workbook and a new sheet
//       const workbook = new ExcelJs.Workbook();
//       const worksheet = workbook.addWorksheet("Bulk  Lead", {
//           pageSetup: { paperSize: 9, orientation: "landscape" },
//       });

//       worksheet.columns = [
//           // Basic Details
//           { header: "ID", key: "_id", width: 20 },
//           { header: "First Name", key: "firstName", width: 20 },
//           { header: "Last Name", key: "lastName", width: 15 },
//           { header: "Mobile Phone", key: "phone", width: 20 },
//           { header: "Company Name", key: "company", width: 20 },
//           { header: "Email", key: "email", width: 20 },
//           // { header: "Check-In", key: "checkIn", width: 20 },
//           // { header: "Check-Out", key: "checkOut", width: 20 },
//           // { header: "Number of Rooms", key: "noOfRooms", width: 20 },
//           // { header: "Display Name", key: "displayName", width: 20 },
//           // { header: "Company Name", key: "companyName", width: 20 },
//           // { header: "Salutation", key: "salutation", width: 15 },
//           // { header: "First Name", key: "firstName", width: 20 },
//           // { header: "Last Name", key: "lastName", width: 20 },
//           // { header: "Phone", key: "phone", width: 15 },
//           // { header: "Currency Code", key: "currencyCode", width: 15 },
//           // { header: "Notes", key: "notes", width: 30 },
//           // { header: "Website", key: "website", width: 25 },
//           // { header: "Status", key: "status", width: 15 },
//           // { header: "Opening Balance", key: "openingBalance", width: 20 },
//           // { header: "Opening Balance Exchange Rate", key: "openingBalanceExchangeRate", width: 25 },
//           // { header: "Branch ID", key: "branchId", width: 20 },
//           // { header: "Branch Name", key: "branchName", width: 20 },
//           // { header: "Bank Account Payment", key: "bankAccountPayment", width: 25 },
//           // { header: "Portal Enabled", key: "portalEnabled", width: 15 },
//           // { header: "Credit Limit", key: "creditLimit", width: 20 },
//           // { header: "Customer SubType", key: "customerSubType", width: 20 },
//           // { header: "Department", key: "department", width: 20 },
//           // { header: "Designation", key: "designation", width: 20 },
//           // { header: "Price List", key: "priceList", width: 20 },
//           // { header: "Payment Terms", key: "paymentTerms", width: 20 },
//           // { header: "Payment Terms Label", key: "paymentTermsLabel", width: 25 },

//           // // Contact Information
//           // { header: "Email ID", key: "emailId", width: 25 },
//           // { header: "Mobile Phone", key: "mobilePhone", width: 20 },
//           // { header: "Skype Identity", key: "skypeIdentity", width: 20 },
//           // { header: "Facebook", key: "facebook", width: 25 },
//           // { header: "Twitter", key: "twitter", width: 25 },

//           // // GST Details
//           // { header: "GST Treatment", key: "gstTreatment", width: 20 },
//           // { header: "GSTIN", key: "gstin", width: 20 },
//           // { header: "Taxable", key: "taxable", width: 10 },
//           // { header: "Tax ID", key: "taxId", width: 15 },
//           // { header: "Tax Name", key: "taxName", width: 20 },
//           // { header: "Tax Percentage", key: "taxPercentage", width: 20 },
//           // { header: "Exemption Reason", key: "exemptionReason", width: 25 },

//           // // Billing Address
//           // { header: "Billing Attention", key: "billingAttention", width: 25 },
//           // { header: "Billing Address", key: "billingAddress", width: 30 },
//           // { header: "Billing Street 2", key: "billingStreet2", width: 25 },
//           // { header: "Billing City", key: "billingCity", width: 20 },
//           // { header: "Billing State", key: "billingState", width: 20 },
//           // { header: "Billing Country", key: "billingCountry", width: 20 },
//           // { header: "Billing County", key: "billingCounty", width: 20 },
//           // { header: "Billing Code", key: "billingCode", width: 20 },
//           // { header: "Billing Phone", key: "billingPhone", width: 20 },
//           // { header: "Billing Fax", key: "billingFax", width: 20 },

//           // // Shipping Address
//           // { header: "Shipping Attention", key: "shippingAttention", width: 25 },
//           // { header: "Shipping Address", key: "shippingAddress", width: 30 },
//           // { header: "Shipping Street 2", key: "shippingStreet2", width: 25 },
//           // { header: "Shipping City", key: "shippingCity", width: 20 },s
//           // { header: "Shipping State", key: "shippingState", width: 20 },
//           // { header: "Shipping Country", key: "shippingCountry", width: 20 },
//           // { header: "Shipping County", key: "shippingCounty", width: 20 },
//           // { header: "Shipping Code", key: "shippingCode", width: 20 },
//           // { header: "Shipping Phone", key: "shippingPhone", width: 20 },
//           // { header: "Shipping Fax", key: "shippingFax", width: 20 },

//           // // Additional Details
//           // { header: "Place of Contact", key: "placeOfContact", width: 25 },
//           // { header: "Place of Contact with State Code", key: "placeOfContactWithStateCode", width: 30 },
//           // { header: "Contact Address ID", key: "contactAddressId", width: 25 },
//           // { header: "Source", key: "source", width: 20 },
//           // { header: "Owner Name", key: "ownerName", width: 20 },
//           // { header: "Primary Contact ID", key: "primaryContactId", width: 25 },
//           // { header: "Contact ID", key: "contactId", width: 20 },
//           // { header: "Contact Name", key: "contactName", width: 20 },
//           // { header: "Contact Type", key: "contactType", width: 20 },
//           // { header: "Last Sync Time", key: "lastSyncTime", width: 25 },
//       ];

//       let Leads = await Lead.find({}).lean().exec();

//       Leads.forEach((Lead) => {

//           worksheet.addRow({
//               _id: Lead._id,
//               firstName: Lead.firstName,
//               lastName: Lead.lastName,
//               phone: Lead.phone,
//               email: Lead.email,
//               company: Lead.company,
//               // enquiryType: Lead.enquiryType,
//               // location: Enquiry.city,
//               // levelOfEnquiry: Enquiry.levelOfEnquiry,
//               // checkIn: Enquiry.checkIn,
//               // checkOut: Enquiry.checkOut,
//               // noOfRooms: Enquiry.noOfRooms,



//               // displayName: contact.displayName,
//               // companyName: contact.companyName,
//               // salutation: contact.salutation,
//               // firstName: contact.firstName,
//               // lastName: contact.lastName,
//               // phone: contact.phone,
//               // currencyCode: contact.currencyCode,
//               // notes: contact.notes,
//               // website: contact.website,
//               // status: contact.status,
//               // openingBalance: contact.openingBalance,
//               // openingBalanceExchangeRate: contact.openingBalanceExchangeRate,
//               // branchId: contact.branchId,
//               // branchName: contact.branchName,
//               // bankAccountPayment: contact.bankAccountPayment,
//               // portalEnabled: contact.portalEnabled,
//               // creditLimit: contact.creditLimit,
//               // customerSubType: contact.customerSubType,
//               // department: contact.department,
//               // gstin: contact.gstin,
//               // designation: contact.designation,
//           });
//       });


//       let filename = `${new Date().getTime()}.xlsx`
//       const filePath = path.join("public", "uploads", filename);
//       await workbook.xlsx.writeFile(`${filePath}`).then(() => {
//           res.send({
//               status: "success",
//               message: "file successfully downloaded",
//               filename: filename,
//           });
//       });

//   } catch (error) {
//       next(error);
//   }
// };







// Define field mapping for export
const FIELD_MAPPING = {
  _id: { header: 'ID', width: 22 },
  firstName: { header: 'First Name', width: 15 },
  lastName: { header: 'Last Name', width: 15 },
  phone: { header: 'Mobile Phone', width: 15 },
  company: { header: 'Company Name', width: 20 },
  email: { header: 'Email', width: 25 },
  leadSource: { header: 'Lead Source', width: 15 },
  leadStatus: { header: 'Lead Status', width: 15 },
  ownerName: { header: 'Account Manager', width: 20 },
  createdAt: { header: 'Created Date', width: 20 },
  updatedAt: { header: 'Last Modified Date', width: 20 },
  // Add additional fields as needed
};


const buildQuery = (req: Request) => {
  const query: any = {};

  // Basic search query
  if (req.query.query) {
    const searchRegex = new RegExp(req.query.query as string, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { company: searchRegex },
      { phone: searchRegex },
      { ownerName: searchRegex },
    ];
  }

  // Advanced search
  if (req.query.advancedSearch) {
    try {
      const advancedParams = JSON.parse(req.query.advancedSearch as string);

      Object.keys(advancedParams).forEach(key => {
        const value = advancedParams[key];

        if (value) {
          // Handle date fields
          if (key === 'createdAt' || key === 'updatedAt') {
            if (value.startDate && value.endDate) {
              query[key] = {
                $gte: new Date(value.startDate),
                $lte: new Date(value.endDate)
              };
            } else if (value.startDate) {
              query[key] = { $gte: new Date(value.startDate) };
            } else if (value.endDate) {
              query[key] = { $lte: new Date(value.endDate) };
            }
          }
          // Handle select fields (exact match)
          else if (key === 'leadSource' || key === 'leadStatus') {
            query[key] = value;
          }
          // Handle text fields (partial match)
          else {
            query[key] = new RegExp(value, 'i');
          }
        }
      });
    } catch (error) {
      console.error("Error parsing advanced search parameters:", error);
    }
  }

  return query;
};


const processFields = (fields?: string[]) => {
  // If no fields specified, use all available fields
  if (!fields || fields.length === 0) {
    return Object.keys(FIELD_MAPPING).map(key => ({
      key,
      ...FIELD_MAPPING[key as keyof typeof FIELD_MAPPING]
    }));
  }

  // Return only selected fields
  return fields.map(key => ({
    key,
    ...FIELD_MAPPING[key as keyof typeof FIELD_MAPPING]
  }));
};


const formatLeadData = (lead: any) => {
  return {
    ...lead,
    // Format dates
    createdAt: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '',
    updatedAt: lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '',
    // Format other fields as needed
  };
};


export const downloadExcelLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get export parameters


    const format = (req.body.format as string) || 'xlsx';
    let fields: string[] = [];

    if (req.body.fields) {
      try {
        fields = req.body.fields as string[];
      } catch (error) {
        console.error("Error parsing fields:", error);
      }
    }

    // Build query based on search parameters
    const query = buildQuery(req);

    // Get leads from database
    const leads = await Lead.find(query).lean().exec();

    // Format date fields and process data
    const formattedLeads = leads.map(formatLeadData);

    // Process fields for export
    const exportFields = processFields(fields);

    // Generate unique filename
    const timestamp = new Date().getTime();
    const directory = path.join("public", "uploads");

    // Ensure directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    let filename = '';

    console.log("format", format);

    switch (format.toLowerCase()) {
      case 'csv':
        filename = await exportToCsv(formattedLeads, exportFields, directory, timestamp);
        break;
      case 'pdf':
        filename = await exportToPdf(formattedLeads, exportFields, directory, timestamp);
        break;
      case 'xlsx':
      default:
        filename = await exportToExcel(formattedLeads, exportFields, directory, timestamp);
        break;
    }

    res.json({
      status: "success",
      message: "File successfully generated",
      filename: filename,
    });

  } catch (error) {
    console.error("Export error:", error);
    next(error);
  }
};


const exportToExcel = async (
  leads: any[],
  fields: any[],
  directory: string,
  timestamp: number
): Promise<string> => {
  // Create a new workbook and worksheet
  const workbook = new ExcelJs.Workbook();
  const worksheet = workbook.addWorksheet("Leads", {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  // Define columns
  worksheet.columns = fields.map(field => ({
    header: field.header,
    key: field.key,
    width: field.width
  }));

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  leads.forEach(lead => {
    const rowData: any = {};
    fields.forEach(field => {
      rowData[field.key] = lead[field.key] !== undefined ? lead[field.key] : '';
    });
    worksheet.addRow(rowData);
  });

  // Add borders to all cells
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Write the file
  const filename = `leads_export_${timestamp}.xlsx`;
  const filePath = path.join(directory, filename);
  await workbook.xlsx.writeFile(filePath);

  return filename;
};


const exportToCsv = async (
  leads: any[],
  fields: any[],
  directory: string,
  timestamp: number
): Promise<string> => {
  // Create CSV writer
  const filename = `leads_export_${timestamp}.csv`;
  const filePath = path.join(directory, filename);

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: fields.map(field => ({
      id: field.key,
      title: field.header
    }))
  });

  // Write data
  await csvWriter.writeRecords(leads);

  return filename;
};


const exportToPdf = async (
  leads: any[],
  fields: any[],
  directory: string,
  timestamp: number
): Promise<string> => {
  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add a page
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  // Define margins and spacing
  const margin = 50;
  const lineHeight = 20;
  const columnWidth = (width - margin * 2) / fields.length;

  // Draw title
  page.drawText('Leads Export', {
    x: margin,
    y: height - margin,
    size: 16,
    font: boldFont
  });

  // Draw export date
  const exportDate = new Date().toLocaleDateString();
  page.drawText(`Generated on: ${exportDate}`, {
    x: margin,
    y: height - margin - lineHeight,
    size: 10,
    font
  });

  // Draw header row
  let x = margin;
  let y = height - margin - lineHeight * 3;

  // Background for header
  page.drawRectangle({
    x: margin - 5,
    y: y - 5,
    width: width - margin * 2 + 10,
    height: lineHeight + 10,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Draw header text
  fields.forEach((field, index) => {
    page.drawText(field.header, {
      x: x + 5,
      y: y,
      size: 10,
      font: boldFont
    });
    x += columnWidth;
  });

  // Draw data rows
  y -= lineHeight + 10;

  // Limit number of rows per page
  const rowsPerPage = Math.floor((height - margin * 2 - lineHeight * 4) / lineHeight);
  let currentRow = 0;

  // Draw each lead row
  for (const lead of leads) {
    // Check if we need a new page
    if (currentRow >= rowsPerPage) {
      // Add new page
      const newPage = pdfDoc.addPage([842, 595]);
      page.drawText('Leads Export (continued)', {
        x: margin,
        y: height - margin,
        size: 16,
        font: boldFont
      });

      // Reset position for new page
      y = height - margin - lineHeight * 3;
      currentRow = 0;

      // Draw header on new page
      let headerX = margin;
      fields.forEach(field => {
        newPage.drawText(field.header, {
          x: headerX + 5,
          y: y,
          size: 10,
          font: boldFont
        });
        headerX += columnWidth;
      });

      y -= lineHeight + 10;
    }

    // Draw row data
    x = margin;
    fields.forEach(field => {
      const value = lead[field.key] !== undefined ? String(lead[field.key]) : '';

      // Truncate long values
      const maxLength = Math.floor(columnWidth / 6);
      const displayValue = value.length > maxLength ? value.substring(0, maxLength) + '...' : value;

      page.drawText(displayValue, {
        x: x + 5,
        y: y,
        size: 8,
        font
      });
      x += columnWidth;
    });

    y -= lineHeight;
    currentRow++;
  }

  // Save the PDF
  const filename = `leads_export_${timestamp}.pdf`;
  const filePath = path.join(directory, filename);
  const pdfBytes = await pdfDoc.save();

  fs.writeFileSync(filePath, pdfBytes);

  return filename;
};


export const downloadTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Lead Template", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Define template columns
    worksheet.columns = [
      { header: "First Name*", key: "firstName", width: 15 },
      { header: "Last Name*", key: "lastName", width: 15 },
      { header: "Email*", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Company", key: "company", width: 20 },
      { header: "Lead Source", key: "leadSource", width: 15 },
      { header: "Lead Status", key: "leadStatus", width: 15 },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add example data
    worksheet.addRow({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "1234567890",
      company: "ABC Corp",
      leadSource: "Website",
      leadStatus: "New"
    });

    // Add dropdown validations
    // Lead Source dropdown
    worksheet.getCell('F2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"website,referral,social,email,other"']
    };

    // Lead Status dropdown
    worksheet.getCell('G2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"new,contacted,qualified,unqualified,converted"']
    };

    // Add instructions
    const instructionSheet = workbook.addWorksheet("Instructions");
    instructionSheet.columns = [
      { header: "Field", key: "field", width: 20 },
      { header: "Description", key: "description", width: 50 },
      { header: "Required", key: "required", width: 10 }
    ];

    // Style the header row
    const instHeaderRow = instructionSheet.getRow(1);
    instHeaderRow.font = { bold: true };
    instHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add instructions
    const instructions = [
      { field: "First Name", description: "Lead's first name", required: "Yes" },
      { field: "Last Name", description: "Lead's last name", required: "Yes" },
      { field: "Email", description: "Lead's email address", required: "Yes" },
      { field: "Phone", description: "Lead's phone number", required: "No" },
      { field: "Company", description: "Lead's company name", required: "No" },
      { field: "Lead Source", description: "Source of the lead (website, referral, social, email, other)", required: "No" },
      { field: "Lead Status", description: "Current status of the lead (new, contacted, qualified, unqualified, converted)", required: "No" }
    ];

    instructions.forEach(instruction => {
      instructionSheet.addRow(instruction);
    });

    // Generate file
    const timestamp = new Date().getTime();
    const filename = `lead_import_template_${timestamp}.xlsx`;
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
      filename: filename
    });

  } catch (error) {
    console.error("Template download error:", error);
    next(error);
  }
};


export const importLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded"
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let importedLeads: any[] = [];

    // Process file based on extension
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      importedLeads = await processExcelFile(filePath);
    } else if (fileExtension === '.csv') {
      importedLeads = await processCsvFile(filePath);
    } else {
      return res.status(400).json({
        status: "error",
        message: "Unsupported file format. Please upload an Excel or CSV file."
      });
    }

    // Validate required fields
    const validationErrors: string[] = [];

    importedLeads.forEach((lead, index) => {
      if (!lead.firstName) {
        validationErrors.push(`Row ${index + 1}: First Name is required`);
      }
      if (!lead.lastName) {
        validationErrors.push(`Row ${index + 1}: Last Name is required`);
      }
      if (!lead.email) {
        validationErrors.push(`Row ${index + 1}: Email is required`);
      }
      // Add other validations as needed
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Validation errors in the imported data",
        errors: validationErrors
      });
    }

    // Save leads to database
    const savedLeads = await Lead.insertMany(importedLeads);

    // Clean up temporary file
    fs.unlinkSync(filePath);

    res.status(200).json({
      status: "success",
      message: `Successfully imported ${savedLeads.length} leads`,
      count: savedLeads.length
    });

  } catch (error) {
    console.error("Import error:", error);
    next(error);
  }
};


const processExcelFile = async (filePath: string): Promise<any[]> => {
  const workbook = new ExcelJs.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(1);
  const leads: any[] = [];

  // Get headers
  const headers: string[] = [];
  worksheet?.getRow(1).eachCell((cell) => {
    // Remove asterisks from header names (if present for required fields)
    const headerName = cell.value?.toString().replace(/\*$/, '').trim();
    headers.push(headerName?.toLocaleLowerCase() || "");
  });

  // Process data rows
  worksheet?.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      const lead: any = {};

      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          lead[header] = cell.value;
        }
      });

      leads.push(lead);
    }
  });

  return leads;
};


const processCsvFile = async (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const leads: any[] = [];
    let headers: string[] = [];

    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true, trim: true }))
      .on('headers', (headerList) => {
        // Clean up header names
        headers = headerList.map((header: string) =>
          header.replace(/\*$/, '').trim().toLocaleLowerCase()
        );
      })
      .on('data', (row) => {
        const lead: any = {};

        headers.forEach(header => {
          lead[header] = row[header];
        });

        leads.push(lead);
      })
      .on('error', (error) => reject(error))
      .on('end', () => resolve(leads));
  });
}