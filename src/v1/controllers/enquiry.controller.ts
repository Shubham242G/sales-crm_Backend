import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import ExcelJs from "exceljs";
import XLSX from "xlsx";
import path from "path";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { ExportService } from "../../util/excelfile";
import fs from "fs";

export const addEnquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // let existsCheck = await Enquiry.findOne({ name: req.body.name , checkIn: req.body.checkIn }).exec();
    // if (existsCheck) {
    //     throw new Error("Same name with the same check in date already exists");
    // }

    // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
    //     console.log("first", req.body.imagesArr)
    //     for (const el of req.body.imagesArr) {
    //         if (el.image && el.image !== "") {
    //             el.image = await storeFileAndReturnNameBase64(el.image);
    //         }
    //     }
    // }
    const enquiry = await new Enquiry({ ...req.body, status: "Enquiry Generated" }).save();
    res.status(201).json({ message: "Enquiry Created", data: enquiry });

    // this condition for check if enquiry successful

    // if (req.body.enquirySucessfull === true) {
    //     const rpf = new Rpf({
    //         name: enquiry.name,
    //         phone: enquiry.phone,
    //         email: enquiry.email,
    //         typeOfContact: enquiry.typeOfContact,
    //         RpfId: enquiry._id,
    //         subject: 'New Enquiry',
    //         details: 'Initial enquiry created automatically.',
    //         priority: 'Normal',
    //     });
    //     await rpf.save();

    // }
  } catch (error) {
    next(error);
  }
};

export const getAllEnquiry = async (req: any, res: any, next: any) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};

    // Add helper fields for searching
    pipeline.push({
      $addFields: {
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
        checkInDateString: { $dateToString: { format: "%Y-%m-%d", date: "$checkIn" } },
        checkOutDateString: { $dateToString: { format: "%Y-%m-%d", date: "$checkOut" } },
        "banquet.dateString": {
          $map: {
            input: "$banquet",
            as: "banq",
            in: { $dateToString: { format: "%Y-%m-%d", date: "$$banq.date" } }
          }
        },
        "airTickets.departureDateString": {
          $dateToString: { format: "%Y-%m-%d", date: "$airTickets.departureDate" }
        },
        "cab.dateString": {
          $map: {
            input: "$cab",
            as: "cabItem",
            in: { $dateToString: { format: "%Y-%m-%d", date: "$$cabItem.date" } }
          }
        }
      }
    });

    // Handle basic search
    if (req.query.query && typeof req.query.query === 'string' && req.query.query.trim() !== "") {
      const searchTerm = req.query.query.trim();
      const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
      
      matchObj.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { fullName: searchRegex },
        { enquiryType: searchRegex },
        { noOfRooms: searchRegex },
        { city: searchRegex },
        { levelOfEnquiry: searchRegex },
        { status: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { companyName: searchRegex },
        { assignedTo: searchRegex },
        { numberOfRooms: searchRegex },
        { "banquet.dateString": searchTerm },
        { checkInDateString: searchTerm },
        { checkOutDateString: searchTerm }
      ];
    }

    // Handle advanced search
    if (req?.query?.advancedSearch) {
      const searchParams = Array.isArray(req.query.advancedSearch)
        ? req.query.advancedSearch
        : typeof req.query.advancedSearch === 'string'
        ? [req.query.advancedSearch]
        : [];

      const advancedConditions = [];

      for (const param of searchParams) {
        if (typeof param !== 'string') continue;
        
        const [field, operator, ...valueParts] = param.split(':');
        const value = valueParts.join(':').trim();
        
        if (!field || !operator || !value) continue;

        const condition = buildAdvancedCondition(field, operator.toLowerCase(), value);
        if (condition) {
          advancedConditions.push(condition);
        }
      }

      if (advancedConditions.length > 0) {
        if (matchObj.$or) {
          matchObj = {
            $and: [
              { $or: matchObj.$or },
              ...advancedConditions
            ]
          };
        } else {
          matchObj = advancedConditions.length === 1 
            ? advancedConditions[0] 
            : { $and: advancedConditions };
        }
      }
    }

    // Add the match stage to the pipeline
    if (Object.keys(matchObj).length > 0) {
      pipeline.push({ $match: matchObj });
    }

    // Handle select input request
    if (req?.query?.isForSelectInput) {
      pipeline.push({
        $project: {
          label: { $concat: ["$firstName", " ", "$lastName"] },
          value: "$_id"
        }
      });
    }

    const EnquiryArr = await paginateAggregate(Enquiry, pipeline, req.query);

    res.status(200).json({
      message: "Found all enquiries successfully",
      data: EnquiryArr.data,
      total: EnquiryArr.total,
    });
  } catch (error) {
    console.error('Error in getAllEnquiry:', error);
    next(error);
  }
};

// Helper function to build advanced search conditions
function buildAdvancedCondition(field: string, operator: string, value: string): Record<string, any> | null {
  const fieldPath = getFieldPath(field);
  const isArrayField = ['banquet', 'room', 'cab'].some(prefix => field.startsWith(`${prefix}.`));

  switch (operator) {
    case 'equals':
      if (isDateField(field)) {
        const date = new Date(value);
        if (isNaN(date.getTime())) return null;
        
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        
        if (isArrayField) {
          const [arrayField, nestedField] = field.split('.');
          return { 
            [arrayField]: { 
              $elemMatch: { 
                [nestedField]: { $gte: start, $lte: end } 
              } 
            } 
          };
        }
        return { [fieldPath]: { $gte: start, $lte: end } };
      }
      
      if (isArrayField) {
        const [arrayField, nestedField] = field.split('.');
        return { 
          [arrayField]: { 
            $elemMatch: { 
              [nestedField]: value 
            } 
          } 
        };
      }
      return { [fieldPath]: value };

    case 'contains':
      if (isArrayField) {
        const [arrayField, nestedField] = field.split('.');
        return { 
          [arrayField]: { 
            $elemMatch: { 
              [nestedField]: { $regex: escapeRegex(value), $options: 'i' } 
            } 
          } 
        };
      }
      return { [fieldPath]: { $regex: escapeRegex(value), $options: 'i' } };

    case 'startswith':
      if (isArrayField) {
        const [arrayField, nestedField] = field.split('.');
        return { 
          [arrayField]: { 
            $elemMatch: { 
              [nestedField]: { $regex: `^${escapeRegex(value)}`, $options: 'i' } 
            } 
          } 
        };
      }
      return { [fieldPath]: { $regex: `^${escapeRegex(value)}`, $options: 'i' } };

    case 'endswith':
      if (isArrayField) {
        const [arrayField, nestedField] = field.split('.');
        return { 
          [arrayField]: { 
            $elemMatch: { 
              [nestedField]: { $regex: `${escapeRegex(value)}$`, $options: 'i' } 
            } 
          } 
        };
      }
      return { [fieldPath]: { $regex: `${escapeRegex(value)}$`, $options: 'i' } };

    case 'greaterthan':
      if (isDateField(field)) {
        const date = new Date(value);
        if (isNaN(date.getTime())) return null;
        
        if (isArrayField) {
          const [arrayField, nestedField] = field.split('.');
          return { 
            [arrayField]: { 
              $elemMatch: { 
                [nestedField]: { $gt: date } 
              } 
            } 
          };
        }
        return { [fieldPath]: { $gt: date } };
      }
      
      const numValue = Number(value);
      if (isArrayField) {
        const [arrayField, nestedField] = field.split('.');
        return { 
          [arrayField]: { 
            $elemMatch: { 
              [nestedField]: isNaN(numValue) ? { $gt: value } : { $gt: numValue } 
            } 
          } 
        };
      }
      return { [fieldPath]: isNaN(numValue) ? { $gt: value } : { $gt: numValue } };

    case 'lessthan':
      if (isDateField(field)) {
        const date = new Date(value);
        if (isNaN(date.getTime())) return null;
        
        if (isArrayField) {
          const [arrayField, nestedField] = field.split('.');
          return { 
            [arrayField]: { 
              $elemMatch: { 
                [nestedField]: { $lt: date } 
              } 
            } 
          };
        }
        return { [fieldPath]: { $lt: date } };
      }
      
      const numValueLt = Number(value);
      if (isArrayField) {
        const [arrayField, nestedField] = field.split('.');
        return { 
          [arrayField]: { 
            $elemMatch: { 
              [nestedField]: isNaN(numValueLt) ? { $lt: value } : { $lt: numValueLt } 
            } 
          } 
        };
      }
      return { [fieldPath]: isNaN(numValueLt) ? { $lt: value } : { $lt: numValueLt } };

    case 'in':
      const inValues = value.split('|').map(v => v.trim()).filter(v => v);
      if (inValues.length === 0) return null;
      
      if (isArrayField) {
        const [arrayField, nestedField] = field.split('.');
        return { 
          [arrayField]: { 
            $elemMatch: { 
              [nestedField]: { $in: inValues } 
            } 
          } 
        };
      }
      return { [fieldPath]: { $in: inValues } };

    case 'notin':
      const notInValues = value.split('|').map(v => v.trim()).filter(v => v);
      if (notInValues.length === 0) return null;
      
      if (isArrayField) {
        const [arrayField, nestedField] = field.split('.');
        return { 
          [arrayField]: { 
            $elemMatch: { 
              [nestedField]: { $nin: notInValues } 
            } 
          } 
        };
      }
      return { [fieldPath]: { $nin: notInValues } };

    default:
      return null;
  }
}

// Helper function to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to get correct field path
function getFieldPath(field: string): string {
  if (field.startsWith('eventSetup.')) {
    return `eventSetup.${field.replace('eventSetup.', '')}`;
  }
  if (field.startsWith('airTickets.')) {
    return `airTickets.${field.replace('airTickets.', '')}`;
  }
  return field;
}

// Helper function to check if field is a date field
function isDateField(field: string): boolean {
  const dateFields = [
    'checkIn', 'checkOut',
    'banquet.date', 'airTickets.departureDate', 'airTickets.returnDate',
    'airTickets.multiDepartureDate', 'cab.date',
    'eventSetup.eventDates.startDate', 'eventSetup.eventDates.endDate',
    'eventSetup.eventStartDate', 'eventSetup.eventEndDate'
  ];
  return dateFields.some(df => field.includes(df));
}




export const getEnquiryById = async (
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
    let existsCheck = await Enquiry.aggregate(pipeline);
    if (!existsCheck || existsCheck.length == 0) {
      throw new Error("Enquiry does not exists");
    }
    existsCheck = existsCheck[0];
    res.status(201).json({
      message: "found specific Enquiry",
      data: existsCheck,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await Enquiry.findById(req.params.id).lean().exec();
    if (!existsCheck) {
      throw new Error("Enquiry does not exists");
    }

    // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
    //     for (const el of req.body.imagesArr) {
    //         if (el.images && el.images !== "" && el.images.includes("base64")) {
    //             el.images = await storeFileAndReturnNameBase64(el.images);
    //         }
    //     }
    // }
    let Obj = await Enquiry.findByIdAndUpdate(req.params.id, req.body).exec();
    res.status(201).json({ message: "Enquiry Updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteEnquiryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await Enquiry.findById(req.params.id).exec();
    if (!existsCheck) {
      throw new Error("Enquiry does not exists or already deleted");
    }
    await Enquiry.findByIdAndDelete(req.params.id).exec();
    res.status(201).json({ message: "Enquiry Deleted" });
  } catch (error) {
    next(error);
  }
};

export const BulkUploadEnquiry: RequestHandler = async (req, res, next) => {
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
      xlData.map(async (el: any) => await new Enquiry(el).save());
    }
    res.status(200).json({ message: "File Uploaded Successfully" });
  } catch (error) {
    next(error);
  }
};

// Caching
// const countryCache = new Map();
// const stateCache = new Map();
// const cityCache = new Map();

// Function to fetch or create records
//         const fetchOrCreateRecord = async (model: any, name: any, cache: any, extraData: any = {}) => {
//             if (cache.has(name)) return cache.get(name);
//             let record = await model.findOne({ name }).lean().exec();
//             if (!record) {
//                 record = await new model({ name, ...extraData }).save();
//             }
//             cache.set(name, record);
//             return record;
//         };

//         const finalArr: any = [];
//         for (let index = 0; index < xlData.length; index++) {
//             const row = xlData[index];

//             let query: any = {
//                 _id: row["ID"],
//                 name: row["Display Name"],
//                 phone: row["Phone"],
//                 email: row["Email"],
//                 typeOfContact: row["Type of Contact"],

//                 // displayName: row["Display Name"],
//                 // companyName: row["Company Name"],
//                 // salutation: row["Salutation"],
//                 // firstName: row["First Name"],
//                 // lastName: row["Last Name"],
//                 // phone: row["Phone"],
//                 // currencyCode: row["Currency Code"],
//                 // notes: row["Notes"],
//                 // website: row["Website"],
//                 // status: row["Status"],
//                 // openingBalance: row["Opening Balance"],
//                 // openingBalanceExchangeRate: row["Opening Balance Exchange Rate"],
//                 // branchId: row["Branch ID"],
//                 // branchName: row["Branch Name"],
//                 // bankAccountPayment: row["Bank Account Payment"],
//                 // portalEnabled: row["Portal Enabled"],
//                 // creditLimit: row["Credit Limit"],
//                 // customerSubType: row["Customer SubType"],
//                 // department: row["Department"],
//                 // designation: row["Designation"],
//                 // priceList: row["Price List"],
//                 // paymentTerms: row["Payment Terms"],
//                 // paymentTermsLabel: row["Payment Terms Label"],
//                 // emailId: row["Email ID"],
//                 // mobilePhone: row["Mobile Phone"],
//                 // skypeIdentity: row["Skype Identity"],
//                 // facebook: row["Facebook"],
//                 // twitter: row["Twitter"],

//                 // // GST Details
//                 // gstTreatment: row["GST Treatment"],
//                 // gstin: row["GSTIN"],
//                 // taxable: row["Taxable"],
//                 // taxId: row["Tax ID"],
//                 // taxName: row["Tax Name"],
//                 // taxPercentage: row["Tax Percentage"],
//                 // exemptionReason: row["Exemption Reason"],

//                 // // Billing Address
//                 // billingAttention: row["Billing Attention"],
//                 // billingAddress: row["Billing Address"],
//                 // billingStreet2: row["Billing Street 2"],
//                 // billingCity: row["Billing City"],
//                 // billingState: row["Billing State"],
//                 // billingCountry: row["Billing Country"],
//                 // billingCounty: row["Billing County"],
//                 // billingCode: row["Billing Code"],
//                 // billingPhone: row["Billing Phone"],
//                 // billingFax: row["Billing Fax"],

//                 // // Shipping Address
//                 // shippingAttention: row["Shipping Attention"],
//                 // shippingAddress: row["Shipping Address"],
//                 // shippingStreet2: row["Shipping Street 2"],
//                 // shippingCity: row["Shipping City"],
//                 // shippingState: row["Shipping State"],
//                 // shippingCountry: row["Shipping Country"],
//                 // shippingCounty: row["Shipping County"],
//                 // shippingCode: row["Shipping Code"],
//                 // shippingPhone: row["Shipping Phone"],
//                 // shippingFax: row["Shipping Fax"],

//                 // // Additional Details
//                 // placeOfContact: row["Place of Contact"],
//                 // placeOfContactWithStateCode: row["Place of Contact with State Code"],
//                 // contactAddressId: row["Contact Address ID"],
//                 // source: row["Source"],
//                 // ownerName: row["Owner Name"],
//                 // primaryContactId: row["Primary Contact ID"],
//                 // contactId: row["Contact ID"],
//                 // contactName: row["Contact Name"],
//                 // contactType: row["Contact Type"],
//                 // lastSyncTime: row["Last Sync Time"],
//             };

//             // Handling Country
//             // if (row["Country"]) {
//             //     const countryObj = await fetchOrCreateRecord(Country, row["Country"], countryCache);
//             //     query.countryId = countryObj._id;
//             //     query.countryName = countryObj.name;
//             // }

//             // Handling State
//             // if (row["State"]) {
//             //     const stateObj = await fetchOrCreateRecord(State, row["State"], stateCache, {
//             //         countryId: query.countryId,
//             //         countryName: query.countryName
//             //     });
//             //     query.stateId = stateObj._id;
//             //     query.stateName = stateObj.name;
//             // }

//             // Handling City
//             // if (row["City"]) {
//             //     const cityObj = await fetchOrCreateRecord(City, row["City"], cityCache, {
//             //         countryId: query.countryId,
//             //         countryName: query.countryName,
//             //         stateId: query.stateId,
//             //         stateName: query.stateName
//             //     });
//             //     query.cityId = cityObj._id;
//             //     query.cityName = cityObj.name;
//             // }

//             // Push the query to final array
//             finalArr.push(query);
//         }

//         console.log(finalArr, "check finalArr")
//         if (finalArr.length > 0) {
//             await Enquiry.insertMany(finalArr);

//         }

//         // Responding back with success
//         res.status(200).json({ message: "Bulk upload Enquiry completed successfully", data: finalArr });
//     } catch (error) {
//         next(error);
//     }
// };

export const downloadExcelEnquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Create a new workbook and a new sheet
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Bulk  Enquiry", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    worksheet.columns = [
      // Basic Details
      { header: "ID", key: "_id", width: 20 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 15 },
      { header: "Enquiry Type", key: "enquiryType", width: 20 },
      { header: "Location", key: "city", width: 20 },
      { header: "Level of Enquiry", key: "levelOfEnquiry", width: 20 },
      { header: "Check-In", key: "checkIn", width: 20 },
      { header: "Check-Out", key: "checkOut", width: 20 },
      { header: "Number of Rooms", key: "noOfRooms", width: 20 },
      // { header: "Display Name", key: "displayName", width: 20 },
      // { header: "Company Name", key: "companyName", width: 20 },
      // { header: "Salutation", key: "salutation", width: 15 },
      // { header: "First Name", key: "firstName", width: 20 },
      // { header: "Last Name", key: "lastName", width: 20 },
      // { header: "Phone", key: "phone", width: 15 },
      // { header: "Currency Code", key: "currencyCode", width: 15 },
      // { header: "Notes", key: "notes", width: 30 },
      // { header: "Website", key: "website", width: 25 },
      // { header: "Status", key: "status", width: 15 },
      // { header: "Opening Balance", key: "openingBalance", width: 20 },
      // { header: "Opening Balance Exchange Rate", key: "openingBalanceExchangeRate", width: 25 },
      // { header: "Branch ID", key: "branchId", width: 20 },
      // { header: "Branch Name", key: "branchName", width: 20 },
      // { header: "Bank Account Payment", key: "bankAccountPayment", width: 25 },
      // { header: "Portal Enabled", key: "portalEnabled", width: 15 },
      // { header: "Credit Limit", key: "creditLimit", width: 20 },
      // { header: "Customer SubType", key: "customerSubType", width: 20 },
      // { header: "Department", key: "department", width: 20 },
      // { header: "Designation", key: "designation", width: 20 },
      // { header: "Price List", key: "priceList", width: 20 },
      // { header: "Payment Terms", key: "paymentTerms", width: 20 },
      // { header: "Payment Terms Label", key: "paymentTermsLabel", width: 25 },

      // // Contact Information
      // { header: "Email ID", key: "emailId", width: 25 },
      // { header: "Mobile Phone", key: "mobilePhone", width: 20 },
      // { header: "Skype Identity", key: "skypeIdentity", width: 20 },
      // { header: "Facebook", key: "facebook", width: 25 },
      // { header: "Twitter", key: "twitter", width: 25 },

      // // GST Details
      // { header: "GST Treatment", key: "gstTreatment", width: 20 },
      // { header: "GSTIN", key: "gstin", width: 20 },
      // { header: "Taxable", key: "taxable", width: 10 },
      // { header: "Tax ID", key: "taxId", width: 15 },
      // { header: "Tax Name", key: "taxName", width: 20 },
      // { header: "Tax Percentage", key: "taxPercentage", width: 20 },
      // { header: "Exemption Reason", key: "exemptionReason", width: 25 },

      // // Billing Address
      // { header: "Billing Attention", key: "billingAttention", width: 25 },
      // { header: "Billing Address", key: "billingAddress", width: 30 },
      // { header: "Billing Street 2", key: "billingStreet2", width: 25 },
      // { header: "Billing City", key: "billingCity", width: 20 },
      // { header: "Billing State", key: "billingState", width: 20 },
      // { header: "Billing Country", key: "billingCountry", width: 20 },
      // { header: "Billing County", key: "billingCounty", width: 20 },
      // { header: "Billing Code", key: "billingCode", width: 20 },
      // { header: "Billing Phone", key: "billingPhone", width: 20 },
      // { header: "Billing Fax", key: "billingFax", width: 20 },

      // // Shipping Address
      // { header: "Shipping Attention", key: "shippingAttention", width: 25 },
      // { header: "Shipping Address", key: "shippingAddress", width: 30 },
      // { header: "Shipping Street 2", key: "shippingStreet2", width: 25 },
      // { header: "Shipping City", key: "shippingCity", width: 20 },s
      // { header: "Shipping State", key: "shippingState", width: 20 },
      // { header: "Shipping Country", key: "shippingCountry", width: 20 },
      // { header: "Shipping County", key: "shippingCounty", width: 20 },
      // { header: "Shipping Code", key: "shippingCode", width: 20 },
      // { header: "Shipping Phone", key: "shippingPhone", width: 20 },
      // { header: "Shipping Fax", key: "shippingFax", width: 20 },

      // // Additional Details
      // { header: "Place of Contact", key: "placeOfContact", width: 25 },
      // { header: "Place of Contact with State Code", key: "placeOfContactWithStateCode", width: 30 },
      // { header: "Contact Address ID", key: "contactAddressId", width: 25 },
      // { header: "Source", key: "source", width: 20 },
      // { header: "Owner Name", key: "ownerName", width: 20 },
      // { header: "Primary Contact ID", key: "primaryContactId", width: 25 },
      // { header: "Contact ID", key: "contactId", width: 20 },
      // { header: "Contact Name", key: "contactName", width: 20 },
      // { header: "Contact Type", key: "contactType", width: 20 },
      // { header: "Last Sync Time", key: "lastSyncTime", width: 25 },
    ];

    let Enquiries = await Enquiry.find({}).lean().exec();

    Enquiries.forEach((Enquiry) => {
      worksheet.addRow({
        _id: Enquiry._id,
        firstName: Enquiry.firstName,
        lastName: Enquiry.lastName,
        enquiryType: Enquiry.enquiryType,
        location: Enquiry.city,
        levelOfEnquiry: Enquiry.levelOfEnquiry,
        checkIn: Enquiry.checkIn,
        checkOut: Enquiry.checkOut,
        noOfRooms: Enquiry.noOfRooms,

        // displayName: contact.displayName,
        // companyName: contact.companyName,
        // salutation: contact.salutation,
        // firstName: contact.firstName,
        // lastName: contact.lastName,
        // phone: contact.phone,
        // currencyCode: contact.currencyCode,
        // notes: contact.notes,
        // website: contact.website,
        // status: contact.status,
        // openingBalance: contact.openingBalance,
        // openingBalanceExchangeRate: contact.openingBalanceExchangeRate,
        // branchId: contact.branchId,
        // branchName: contact.branchName,
        // bankAccountPayment: contact.bankAccountPayment,
        // portalEnabled: contact.portalEnabled,
        // creditLimit: contact.creditLimit,
        // customerSubType: contact.customerSubType,
        // department: contact.department,
        // gstin: contact.gstin,
        // designation: contact.designation,
      });
    });

    let filename = `${new Date().getTime()}.xlsx`;
    const filePath = path.join("public", "uploads", filename);
    await workbook.xlsx.writeFile(`${filePath}`).then(() => {
      res.send({
        status: "success",
        message: "file successfully downloaded",
        filename: filename,
      });
    });
  } catch (error) {
    next(error);
  }
};

// export const convertRpf = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         if (!req.params.id) {
//             return res.status(400).json({ message: "Enquiry ID is required" });
//         }

//         // Fetch the enquiry
//         const enquiry = await Enquiry.findById(req.params.id).exec();
//         if (!enquiry) {
//             return res.status(404).json({ message: "Enquiry not found" });
//         }

//         // Extract eventDates from enquiry
//         let eventDates = enquiry.eventSetup?.eventDates || [];

//         // Map event dates into an array of strings (or Date objects)
//         let formattedEventDates = eventDates.map(event => ({
//             startDate: event.startDate,
//             endDate: event.endDate
//         }));

//         // Create a new Rfp with autofilled event dates
//         const rfp = new Rfp({
//             rfpId: new mongoose.Types.ObjectId(),
//             serviceType: [], // You can populate this based on business logic
//             eventDate: formattedEventDates, // Autofilled event dates
//             eventDetails: "",
//             deadlineOfProposal: "",
//             vendorList: [],
//             additionalInstructions: ""
//         });

//         await rfp.save();

//         res.status(200).json({ message: "RFP created successfully", data: rfp });

//     } catch (error) {
//         next(error);
//     }
// };


export const convertRfp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const enquiryId = req.params.id;
    if (!enquiryId) {
      return res.status(400).json({ message: "Enquiry ID is required" });
    }


    const enquiry = await Enquiry.findById(enquiryId).exec();
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }


    const existingRfp = await Rfp.findOne({ enquiryId: enquiry._id }).lean().exec();
    if (existingRfp) {
      return res.status(400).json({ message: "RFP already exists for this enquiry" });
    }


    const lastRfp = await Rfp.findOne().sort({ _id: -1 }).exec();
    const rfpId = lastRfp && lastRfp.rfpId
      ? `RFP${(parseInt(lastRfp.rfpId.replace("RFP", ""), 10) + 1).toString().padStart(6, "0")}`
      : "RFP000001";


    const serviceTypeArr = [];
    if (enquiry.cab?.length > 0) serviceTypeArr.push("Transport");
    if (enquiry.banquet?.length > 0) serviceTypeArr.push("Banquet");
    if (enquiry.room?.length > 0) serviceTypeArr.push("Hotel");
    if (enquiry.eventSetup) serviceTypeArr.push("Event");


    const eventDates = enquiry.eventSetup?.eventDates?.length
      ? enquiry.eventSetup.eventDates.map((date) => ({
        startDate: date.startDate,
        endDate: date.endDate,
      }))
      : [
        {
          startDate: enquiry.eventSetup?.eventStartDate || "",
          endDate: enquiry.eventSetup?.eventEndDate || "",
        },
      ];



    console.log("eventDates", enquiry.eventSetup?.eventDates)


    console.log(enquiry, "check enquiry when convert rfp")


    const rfp = new Rfp({
      rfpId,
      deadlineOfProposal: "",
      serviceType: serviceTypeArr,
      eventDates: enquiry.eventSetup?.eventDates || [],
      eventDetails: `${enquiry.eventSetup?.functionType || ""} - ${enquiry.eventSetup?.setupRequired || ""
        }`.trim(),
      enquiryId: enquiry._id,
      fullName: `${enquiry.firstName} ${enquiry.lastName || ""}`.trim(),
      vendorList: [],
      displayName: enquiry.displayName,
      markupPercentage:0,
      leadId: enquiry.leadId,
      // vendorList: [
      //   {
      //     label: `${enquiry.firstName} ${enquiry.lastName || ""}`.trim(),
      //     value: enquiry._id.toString(),
      //   },
      // ],
      additionalInstructions: "",
      status: "RFP raised to vendor",
    });

    const newRfp = await rfp.save();

    if (enquiryId) {
      await Enquiry.findByIdAndUpdate(enquiryId, { status: "RFP raised to vendor" });
    }

    console.log("newRfp===>>>>", newRfp);

    await enquiry.save();

    const id = newRfp._id;


    return res.status(200).json({
      message: "RFP conversion completed successfully",
      data: { rfp, id }
    });
  } catch (error) {
    next(error);
  }
};

export const downloadExcelEnquiries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isSelectedExport =
    req.body.tickRows &&
    Array.isArray(req.body.tickRows) &&
    req.body.tickRows.length > 0;

  return ExportService.downloadFile(req, res, next, {
    model: Enquiry,
    buildQuery: buildEnquiryQuery,
    formatData: formatEnquiryData,
    processFields: processEnquiryFields,
    filename: isSelectedExport ? "selected_enquiries" : "enquiries",
    worksheetName: isSelectedExport ? "Selected Enquiries" : "All Enquiries",
    title: isSelectedExport ? "Selected Enquiries" : "Enquiry List",
  });
};

const buildEnquiryQuery = (req: Request) => {
  const query: any = {};

  // Handle selected rows export
  if (req.body.tickRows?.length > 0) {
    query._id = { $in: req.body.tickRows };
    return query;
  }

  // Apply regular filters
  if (req.body.status) {
    query.status = req.body.status;
  }

  if (req.body.enquiryType) {
    query.enquiryType = req.body.enquiryType;
  }

  if (req.body.city) {
    query.city = req.body.city;
  }

  if (req.body.leadOwner) {
    query.leadOwner = req.body.leadOwner;
  }

  if (req.body.dateFrom && req.body.dateTo) {
    query.createdAt = {
      $gte: new Date(req.body.dateFrom),
      $lte: new Date(req.body.dateTo),
    };
  }

  if (req.body.search) {
    query.$or = [
      { displayName: { $regex: req.body.search, $options: "i" } },
      { companyName: { $regex: req.body.search, $options: "i" } },
      { email: { $regex: req.body.search, $options: "i" } },
      { phoneNumber: { $regex: req.body.search, $options: "i" } },
    ];
  }

  return query;
};

const formatEnquiryData = (enquiry: any) => {
  // Helper functions
  const formatDate = (date: Date | string) => 
    date ? new Date(date).toLocaleDateString() : '';
    
  const formatArray = (arr: any[]) => arr?.join(', ') || '';

  // Format complex fields
  const banquetDates = enquiry.banquet?.map((b:any) => 
    `${formatDate(b.date)} (${b.time})`).join('\n') || '';
    
  const roomDetails = enquiry.room?.map((r:any) => 
    `${r.date}: ${r.noOfRooms} ${r.roomCategory} rooms`).join('\n') || '';
    
  const eventDates = enquiry.eventSetup?.eventDates?.map((e:any) => 
    `${formatDate(e.startDate)} to ${formatDate(e.endDate)}`).join('\n') || '';
    
  const cabDetails = enquiry.cab?.map((c:any) => 
    `${formatDate(c.date)}: ${c.fromCity} → ${c.toCity}`).join('\n') || '';

  return {
    // Basic Info
    id: enquiry._id,
    displayName: enquiry.displayName,
    contact: `${enquiry.firstName} ${enquiry.lastName}`,
    company: enquiry.companyName,
    email: enquiry.email,
    phone: enquiry.phoneNumber,
    leadOwner: enquiry.leadOwner,
    
    // Enquiry Details
    enquiryType: enquiry.enquiryType,
    status: enquiry.status,
    level: enquiry.levelOfEnquiry,
    hotelPref: enquiry.hotelPreferences || enquiry.othersPreference,
    
    // Dates
    checkIn: formatDate(enquiry.checkIn),
    checkOut: formatDate(enquiry.checkOut),
    createdAt: formatDate(enquiry.createdAt),
    
    // Hotel Details
    city: enquiry.city,
    area: enquiry.area,
    rooms: enquiry.noOfRooms,
    categories: formatArray(enquiry.categoryOfHotel),
    occupancy: formatArray(enquiry.occupancy),
    
    // Banquet
    banquetDates,
    banquetCount: enquiry.banquet?.length || 0,
    
    // Rooms
    roomDetails,
    
    // Event
    eventType: enquiry.eventSetup?.functionType,
    eventDates,
    
    // Air Tickets
    airTrip: enquiry.airTickets?.tripType,
    airPassengers: enquiry.airTickets?.numberOfPassengers,
    airRoute: enquiry.airTickets?.fromCity 
      ? `${enquiry.airTickets.fromCity} → ${enquiry.airTickets.toCity}`
      : '',
      
    // Cab
    cabDetails,
    cabCount: enquiry.cab?.length || 0,
  };
};

const processEnquiryFields = (fields: string[]) => {
  const fieldMapping = {
    // Basic Info
    id: { key: "id", header: "ID", width: 20 },
    displayName: { key: "displayName", header: "Enquiry Name", width: 25 },
    contact: { key: "contact", header: "Contact Person", width: 25 },
    company: { key: "company", header: "Company", width: 25 },
    email: { key: "email", header: "Email", width: 30 },
    phone: { key: "phone", header: "Phone", width: 20 },
    leadOwner: { key: "leadOwner", header: "Lead Owner", width: 20 },
    
    // Enquiry Details
    enquiryType: { key: "enquiryType", header: "Type", width: 15 },
    status: { key: "status", header: "Status", width: 15 },
    level: { key: "level", header: "Priority", width: 15 },
    hotelPref: { key: "hotelPref", header: "Preferences", width: 30 },
    
    // Dates
    checkIn: { key: "checkIn", header: "Check-In", width: 15 },
    checkOut: { key: "checkOut", header: "Check-Out", width: 15 },
    createdAt: { key: "createdAt", header: "Created", width: 15 },
    
    // Hotel Details
    city: { key: "city", header: "City", width: 15 },
    area: { key: "area", header: "Area", width: 15 },
    rooms: { key: "rooms", header: "Total Rooms", width: 15 },
    categories: { key: "categories", header: "Categories", width: 25 },
    occupancy: { key: "occupancy", header: "Occupancy", width: 20 },
    
    // Banquet
    banquetDates: { key: "banquetDates", header: "Banquet Dates", width: 30 },
    banquetCount: { key: "banquetCount", header: "# Banquets", width: 15 },
    
    // Rooms
    roomDetails: { key: "roomDetails", header: "Room Details", width: 40 },
    
    // Event
    eventType: { key: "eventType", header: "Event Type", width: 20 },
    eventDates: { key: "eventDates", header: "Event Dates", width: 30 },
    
    // Air Tickets
    airTrip: { key: "airTrip", header: "Flight Type", width: 15 },
    airPassengers: { key: "airPassengers", header: "Passengers", width: 15 },
    airRoute: { key: "airRoute", header: "Route", width: 25 },
    
    // Cab
    cabDetails: { key: "cabDetails", header: "Cab Details", width: 40 },
    cabCount: { key: "cabCount", header: "# Cab Bookings", width: 15 },
  };

  return fields.length === 0
    ? Object.values(fieldMapping)
    : fields
        .map((field) => fieldMapping[field as keyof typeof fieldMapping])
        .filter(Boolean);
};

export const downloadEnquiryTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Enquiry Template", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Define columns
    worksheet.columns = [
      { header: "Enquiry Type*", key: "enquiryType", width: 20 },
      { header: "First Name*", key: "firstName", width: 20 },
      { header: "Last Name*", key: "lastName", width: 20 },
      { header: "Company Name", key: "companyName", width: 25 },
      { header: "Email*", key: "email", width: 30 },
      { header: "Phone*", key: "phoneNumber", width: 20 },
      { header: "City", key: "city", width: 15 },
      { header: "Check-In Date", key: "checkIn", width: 15 },
      { header: "Check-Out Date", key: "checkOut", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add data validation
    ['A2', 'J2'].forEach(cell => {
      worksheet.getCell(cell).dataValidation = {
        type: "list",
        allowBlank: cell === 'J2',
        formulae: [
          cell === 'A2' 
            ? '"Hotel,Event,Air Ticket,Cab,Banquet"'
            : '"New,In Progress,Confirmed,Cancelled"'
        ],
      };
    });

    // Add sample data
    const sampleDate = new Date();
    worksheet.addRow({
      enquiryType: "Hotel",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phoneNumber: "9876543210",
      city: "Mumbai",
      checkIn: sampleDate.toISOString().split('T')[0],
      checkOut: new Date(sampleDate.setDate(sampleDate.getDate() + 3)).toISOString().split('T')[0],
      status: "New"
    });

    // Add instructions sheet
    const instructionSheet = workbook.addWorksheet("Instructions");
    instructionSheet.columns = [
      { header: "Field", key: "field", width: 20 },
      { header: "Description", key: "description", width: 50 },
      { header: "Required", key: "required", width: 10 },
    ];

    instructionSheet.getRow(1).font = { bold: true };
    instructionSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const instructions = [
      { field: "Enquiry Type", description: "Type of enquiry", required: "Yes" },
      { field: "First Name", description: "Contact person's first name", required: "Yes" },
      { field: "Last Name", description: "Contact person's last name", required: "Yes" },
      { field: "Company Name", description: "Contact's company", required: "No" },
      { field: "Email", description: "Contact's email", required: "Yes" },
      { field: "Phone", description: "Contact's phone", required: "Yes" },
      { field: "City", description: "Primary location", required: "No" },
      { field: "Check-In Date", description: "Format: YYYY-MM-DD", required: "No" },
      { field: "Check-Out Date", description: "Format: YYYY-MM-DD", required: "No" },
      { field: "Status", description: "Current enquiry status", required: "No" },
    ];

    instructions.forEach(inst => instructionSheet.addRow(inst));

    // Generate file
    const filename = `enquiry_import_template_${Date.now()}.xlsx`;
    const filePath = path.join("public", "uploads", filename);
    
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await workbook.xlsx.writeFile(filePath);

    res.json({
      status: "success",
      message: "Enquiry template downloaded",
      filename,
    });
  } catch (error) {
    console.error("Enquiry template generation failed:", error);
    next(error);
  }
};