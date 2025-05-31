import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Lead } from "@models/lead.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { first, last } from "lodash";
import XLSX from "xlsx";
import path from "path";
import ExcelJs from "exceljs";

import fs from "fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as csv from "fast-csv";
import { createObjectCsvWriter } from "csv-writer";
import { Contact } from "@models/contact.model";
import { ExportService } from "../../util/excelfile";

export const addLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await Lead.findOne({
      $or: [{ phone: req.body.phone }, { email: req.body.email }],
    }).exec();
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

export const getAllLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
          fullName: {
            $regex: new RegExp(
              `${typeof req?.query?.query === "string" ? req.query.query : ""}`,
              "i"
            ),
          },
        },

   
        {
          email: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          company: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          phone: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          ownerName: new RegExp(
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

    // Handle request for select input options
    if (req?.query?.isForSelectInput) {
      pipeline.push({
        $project: {
          label: { $concat: ["$firstName", " ", "$lastName"] },
          value: "$_id",
        },
      });
    }

    // Use your existing pagination function
    let LeadArr = await paginateAggregate(Lead, pipeline, req.query);

    res.status(201).json({
      message: "found all leads",
      data: LeadArr.data,
      total: LeadArr.total,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

export const updateLeadById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

export const deleteLeadById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

export const convertToContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const existingContact = await Contact.findOne({
      leadId: req.params.id,
    }).exec();
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
      res.status(200).json({
        message: "Contact conversion completed successfully",
        data: { contact, id },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const convertToEnquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const lead = await Lead.findById(req.params.id).exec();
    if (!lead) {
      throw new Error("Lead not found");
    }

    const existingEnquiry = await Enquiry.findOne({
      leadId: req.params.id,
    }).exec();
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

      console.log("newEnquiry", newEnquiry);
      const id = newEnquiry._id;
      res.status(200).json({
        message: "Contact conversion completed successfully",
        data: { lead, id },
      });
    }

    res.status(500).json({ message: "Something Went Wrong" });
  } catch (error) {
    next(error);
  }
};

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
      xlData.map(async (el: any) => await new Lead(el).save());
    }
    res.status(200).json({ message: "File Uploaded Successfully" });
  } catch (error) {
    next(error);
  }
};

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

export const downloadExcelLead = async (
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
    model: Lead,
    buildQuery: buildQuery, // This function now handles both scenarios
    formatData: formatLeadData,
    processFields: processFields,
    filename: isSelectedExport ? "selected_leads" : "leads",
    worksheetName: isSelectedExport ? "Selected Leads" : "Leads",
    title: isSelectedExport ? "Selected Leads" : "Leads",
  });
};

const buildQuery = (req: Request) => {
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
    query.createdAt = {
      $gte: new Date(req.body.dateFrom),
      $lte: new Date(req.body.dateTo),
    };
  }

  // Add other existing filters here
  if (req.body.source) {
    query.source = req.body.source;
  }

  if (req.body.assignedTo) {
    query.assignedTo = req.body.assignedTo;
  }

  // Add search functionality if needed
  if (req.body.search) {
    query.$or = [
      { name: { $regex: req.body.search, $options: "i" } },
      { email: { $regex: req.body.search, $options: "i" } },
      { phone: { $regex: req.body.search, $options: "i" } },
    ];
  }

  return query;
};

const formatLeadData = (lead: any) => {
  console.log(lead, "check lead vlaue in lead controller");

  console.log(lead.firstName, "check firstName");
  return {
    id: lead._id,
    salutation: lead.salutation,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt
      ? new Date(lead.createdAt).toLocaleDateString()
      : "",
    // Add other fields as needed
  };
};

const processFields = (fields: string[]) => {
  const fieldMapping = {
    id: { key: "id", header: "ID", width: 15 },
    firstName: { key: "firstName", header: "First Name", width: 25 },
    lastName: { key: "lastName", header: "Last Name", width: 25 },
    email: { key: "email", header: "Email", width: 30 },
    phone: { key: "phone", header: "Phone", width: 20 },
    status: { key: "status", header: "Status", width: 15 },
    createdAt: { key: "createdAt", header: "Created At", width: 20 },
  };

  if (fields.length === 0) {
    // Return all fields if none specified
    return Object.values(fieldMapping);
  }

  return fields
    .map((field: string) => fieldMapping[field as keyof typeof fieldMapping])
    .filter((item) => Boolean(item));
};

export const downloadTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Contact Template", {
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
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add example data
    worksheet.addRow({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "1234567890",
      company: "ABC Corp",
      leadSource: "Website",
      leadStatus: "New",
    });

    // Add dropdown validations
    // Lead Source dropdown
    worksheet.getCell("F2").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"website,referral,social,email,other"'],
    };

    // Lead Status dropdown
    worksheet.getCell("G2").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"new,contacted,qualified,unqualified,converted"'],
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
        field: "First Name",
        description: "Lead's first name",
        required: "Yes",
      },
      { field: "Last Name", description: "Lead's last name", required: "Yes" },
      { field: "Email", description: "Lead's email address", required: "Yes" },
      { field: "Phone", description: "Lead's phone number", required: "No" },
      { field: "Company", description: "Lead's company name", required: "No" },
      {
        field: "Lead Source",
        description:
          "Source of the lead (website, referral, social, email, other)",
        required: "No",
      },
      {
        field: "Lead Status",
        description:
          "Current status of the lead (new, contacted, qualified, unqualified, converted)",
        required: "No",
      },
    ];

    instructions.forEach((instruction) => {
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
      filename: filename,
    });
  } catch (error) {
    console.error("Template download error:", error);
    next(error);
  }
};

export const importLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let importedLeads: any[] = [];

    // Process file based on extension
    if (fileExtension === ".xlsx" || fileExtension === ".xls") {
      importedLeads = await processExcelFile(filePath);
    } else if (fileExtension === ".csv") {
      importedLeads = await processCsvFile(filePath);
    } else {
      return res.status(400).json({
        status: "error",
        message: "Unsupported file format. Please upload an Excel or CSV file.",
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
        errors: validationErrors,
      });
    }

    // Save leads to database
    const savedLeads = await Lead.insertMany(importedLeads);

    // Clean up temporary file
    fs.unlinkSync(filePath);

    res.status(200).json({
      status: "success",
      message: `Successfully imported ${savedLeads.length} leads`,
      count: savedLeads.length,
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
    const headerName = cell.value?.toString().replace(/\*$/, "").trim();
    headers.push(headerName?.toLocaleLowerCase() || "");
  });

  // Process data rows
  worksheet?.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      // Skip header row
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
      .on("headers", (headerList) => {
        // Clean up header names
        headers = headerList.map((header: string) =>
          header.replace(/\*$/, "").trim().toLocaleLowerCase()
        );
      })
      .on("data", (row) => {
        const lead: any = {};

        headers.forEach((header) => {
          lead[header] = row[header];
        });

        leads.push(lead);
      })
      .on("error", (error) => reject(error))
      .on("end", () => resolve(leads));
  });
};
