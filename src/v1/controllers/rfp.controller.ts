import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Enquiry } from "@models/enquiry.model";
import ExcelJs from "exceljs";
import XLSX from "xlsx";
import path from 'path'
import fs from "fs";
import { ExportService } from "../../util/excelfile";



import { Rfp } from "@models/rfp.model"
import { QuotesFromVendors } from "@models/quotesFromVendors.model";



// serviceType: '',
// eventDate: '',
// eventDetails: '',
// deadlineOfProposal: '',
// vendorList: '',
// additionalInstructions: '',



export const addRfp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const lastDocument = await Rfp.findOne().sort({ _id: -1 });
        let rfpId = lastDocument?.rfpId ? `RFP${(parseInt(lastDocument.rfpId.replace(/\D/g, "")) + 1).toString().padStart(6, "0")}` : "RFP000001";


        const rfp = new Rfp({ ...req.body, rfpId, status: "RFP raised to vendor" });






        // Update Enquiry status to "Rfp raised to vendor"
        if (req.body.enquiryId) {
            await Enquiry.findByIdAndUpdate(req.body.enquiryId, { status: "Rfp raised to vendor" });
        }


        await rfp.save();

        res.status(201).json({ message: "RFP Created", rfpId });
    } catch (error) {
        next(error);
    }
};

export const getAllRfp = async (req: any, res: any, next: any) => {
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
              status: {
                $regex: new RegExp(
                  `${typeof req?.query?.query === "string" ? req.query.query : ""}`,
                  "i"
                ),
              },
            },
    
       
            {
              displayName: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            {
              fullName: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            {
              deadlineOfProposal: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
           
    
            
            //check for fullName
          ];
          
          
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
        let RfpArr = await paginateAggregate(Rfp, pipeline, req.query);

        if (req.query.query) {

            const $or: Array<Record<string, any>> = [];
            $or.push({ rfpId: new RegExp(req.query.query, "i") });
            matchObj.$or = $or;
        }

        res.status(201).json({ message: "found all Device", data: RfpArr.data, total: RfpArr.total });
        console.log("RfpArr", RfpArr)
    } catch (error) {
        next(error);
    }
};

export const getRfpById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Rfp.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Rfp does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Rfp",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateRfpById = async (req: Request, res: Response, next: NextFunction) => {


    try {
        let existsCheck = await Rfp.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Rfp does not exists");
        }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     for (const el of req.body.imagesArr) {
        //         if (el.images && el.images !== "" && el.images.includes("base64")) {
        //             el.images = await storeFileAndReturnNameBase64(el.images);
        //         }
        //     }
        // }
        let Obj = await Rfp.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Rfp Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteRfpById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Rfp.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Enquiry does not exists or already deleted");
        }
        await Rfp.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Rfp Deleted" });
    } catch (error) {
        next(error);
    }
};


export const BulkUploadRfp: RequestHandler = async (req, res, next) => {
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

                // displayName: row["Display Name"],
                // companyName: row["Company Name"],
                // salutation: row["Salutation"],
                // firstName: row["First Name"],
                // lastName: row["Last Name"],
                // phone: row["Phone"],
                // currencyCode: row["Currency Code"],
                // notes: row["Notes"],
                // website: row["Website"],
                // status: row["Status"],
                // openingBalance: row["Opening Balance"],
                // openingBalanceExchangeRate: row["Opening Balance Exchange Rate"],
                // branchId: row["Branch ID"],
                // branchName: row["Branch Name"],
                // bankAccountPayment: row["Bank Account Payment"],
                // portalEnabled: row["Portal Enabled"],
                // creditLimit: row["Credit Limit"],
                // customerSubType: row["Customer SubType"],
                // department: row["Department"],
                // designation: row["Designation"],
                // priceList: row["Price List"],
                // paymentTerms: row["Payment Terms"],
                // paymentTermsLabel: row["Payment Terms Label"],
                // emailId: row["Email ID"],
                // mobilePhone: row["Mobile Phone"],
                // skypeIdentity: row["Skype Identity"],
                // facebook: row["Facebook"],
                // twitter: row["Twitter"],

                // // GST Details
                // gstTreatment: row["GST Treatment"],
                // gstin: row["GSTIN"],
                // taxable: row["Taxable"],
                // taxId: row["Tax ID"],
                // taxName: row["Tax Name"],
                // taxPercentage: row["Tax Percentage"],
                // exemptionReason: row["Exemption Reason"],

                // // Billing Address
                // billingAttention: row["Billing Attention"],
                // billingAddress: row["Billing Address"],
                // billingStreet2: row["Billing Street 2"],
                // billingCity: row["Billing City"],
                // billingState: row["Billing State"],
                // billingCountry: row["Billing Country"],
                // billingCounty: row["Billing County"],
                // billingCode: row["Billing Code"],
                // billingPhone: row["Billing Phone"],
                // billingFax: row["Billing Fax"],

                // // Shipping Address
                // shippingAttention: row["Shipping Attention"],
                // shippingAddress: row["Shipping Address"],
                // shippingStreet2: row["Shipping Street 2"],
                // shippingCity: row["Shipping City"],
                // shippingState: row["Shipping State"],
                // shippingCountry: row["Shipping Country"],
                // shippingCounty: row["Shipping County"],
                // shippingCode: row["Shipping Code"],
                // shippingPhone: row["Shipping Phone"],
                // shippingFax: row["Shipping Fax"],

                // // Additional Details
                // placeOfContact: row["Place of Contact"],
                // placeOfContactWithStateCode: row["Place of Contact with State Code"],
                // contactAddressId: row["Contact Address ID"],
                // source: row["Source"],
                // ownerName: row["Owner Name"],
                // primaryContactId: row["Primary Contact ID"],
                // contactId: row["Contact ID"],
                // contactName: row["Contact Name"],
                // contactType: row["Contact Type"],
                // lastSyncTime: row["Last Sync Time"],
            };




            // Handling Country
            // if (row["Country"]) {
            //     const countryObj = await fetchOrCreateRecord(Country, row["Country"], countryCache);
            //     query.countryId = countryObj._id;
            //     query.countryName = countryObj.name;
            // }

            // Handling State
            // if (row["State"]) {
            //     const stateObj = await fetchOrCreateRecord(State, row["State"], stateCache, {
            //         countryId: query.countryId,
            //         countryName: query.countryName
            //     });
            //     query.stateId = stateObj._id;
            //     query.stateName = stateObj.name;
            // }

            // Handling City
            // if (row["City"]) {
            //     const cityObj = await fetchOrCreateRecord(City, row["City"], cityCache, {
            //         countryId: query.countryId,
            //         countryName: query.countryName,
            //         stateId: query.stateId,
            //         stateName: query.stateName
            //     });
            //     query.cityId = cityObj._id;
            //     query.cityName = cityObj.name;
            // }

            // Push the query to final array
            finalArr.push(query);
        }


        if (finalArr.length > 0) {
            await Rfp.insertMany(finalArr);

        }

        // Responding back with success
        res.status(200).json({ message: "Bulk upload Enquiry completed successfully", data: finalArr });
    } catch (error) {
        next(error);
    }
};

// export const downloadExcelRfp = async (req: Request, res: Response, next: NextFunction) => {
//     try {


//         // Create a new workbook and a new sheet
//         const workbook = new ExcelJs.Workbook();
//         const worksheet = workbook.addWorksheet("Bulk  Enquiry", {
//             pageSetup: { paperSize: 9, orientation: "landscape" },
//         });

//         worksheet.columns = [
//             // Basic Details
//             { header: "ID", key: "_id", width: 20 },
//             { header: "Display Name", key: "name", width: 20 },
//             { header: "Phone", key: "phone", width: 15 },
//             { header: "Email", key: "email", width: 20 },
//             { header: "Type of Contact", key: "typeOfContact", width: 20 },
//             // { header: "Display Name", key: "displayName", width: 20 },
//             // { header: "Company Name", key: "companyName", width: 20 },
//             // { header: "Salutation", key: "salutation", width: 15 },
//             // { header: "First Name", key: "firstName", width: 20 },
//             // { header: "Last Name", key: "lastName", width: 20 },
//             // { header: "Phone", key: "phone", width: 15 },
//             // { header: "Currency Code", key: "currencyCode", width: 15 },
//             // { header: "Notes", key: "notes", width: 30 },
//             // { header: "Website", key: "website", width: 25 },
//             // { header: "Status", key: "status", width: 15 },
//             // { header: "Opening Balance", key: "openingBalance", width: 20 },
//             // { header: "Opening Balance Exchange Rate", key: "openingBalanceExchangeRate", width: 25 },
//             // { header: "Branch ID", key: "branchId", width: 20 },
//             // { header: "Branch Name", key: "branchName", width: 20 },
//             // { header: "Bank Account Payment", key: "bankAccountPayment", width: 25 },
//             // { header: "Portal Enabled", key: "portalEnabled", width: 15 },
//             // { header: "Credit Limit", key: "creditLimit", width: 20 },
//             // { header: "Customer SubType", key: "customerSubType", width: 20 },
//             // { header: "Department", key: "department", width: 20 },
//             // { header: "Designation", key: "designation", width: 20 },
//             // { header: "Price List", key: "priceList", width: 20 },
//             // { header: "Payment Terms", key: "paymentTerms", width: 20 },
//             // { header: "Payment Terms Label", key: "paymentTermsLabel", width: 25 },

//             // // Contact Information
//             // { header: "Email ID", key: "emailId", width: 25 },
//             // { header: "Mobile Phone", key: "mobilePhone", width: 20 },
//             // { header: "Skype Identity", key: "skypeIdentity", width: 20 },
//             // { header: "Facebook", key: "facebook", width: 25 },
//             // { header: "Twitter", key: "twitter", width: 25 },

//             // // GST Details
//             // { header: "GST Treatment", key: "gstTreatment", width: 20 },
//             // { header: "GSTIN", key: "gstin", width: 20 },
//             // { header: "Taxable", key: "taxable", width: 10 },
//             // { header: "Tax ID", key: "taxId", width: 15 },
//             // { header: "Tax Name", key: "taxName", width: 20 },
//             // { header: "Tax Percentage", key: "taxPercentage", width: 20 },
//             // { header: "Exemption Reason", key: "exemptionReason", width: 25 },

//             // // Billing Address
//             // { header: "Billing Attention", key: "billingAttention", width: 25 },
//             // { header: "Billing Address", key: "billingAddress", width: 30 },
//             // { header: "Billing Street 2", key: "billingStreet2", width: 25 },
//             // { header: "Billing City", key: "billingCity", width: 20 },
//             // { header: "Billing State", key: "billingState", width: 20 },
//             // { header: "Billing Country", key: "billingCountry", width: 20 },
//             // { header: "Billing County", key: "billingCounty", width: 20 },
//             // { header: "Billing Code", key: "billingCode", width: 20 },
//             // { header: "Billing Phone", key: "billingPhone", width: 20 },
//             // { header: "Billing Fax", key: "billingFax", width: 20 },

//             // // Shipping Address
//             // { header: "Shipping Attention", key: "shippingAttention", width: 25 },
//             // { header: "Shipping Address", key: "shippingAddress", width: 30 },
//             // { header: "Shipping Street 2", key: "shippingStreet2", width: 25 },
//             // { header: "Shipping City", key: "shippingCity", width: 20 },
//             // { header: "Shipping State", key: "shippingState", width: 20 },
//             // { header: "Shipping Country", key: "shippingCountry", width: 20 },
//             // { header: "Shipping County", key: "shippingCounty", width: 20 },
//             // { header: "Shipping Code", key: "shippingCode", width: 20 },
//             // { header: "Shipping Phone", key: "shippingPhone", width: 20 },
//             // { header: "Shipping Fax", key: "shippingFax", width: 20 },

//             // // Additional Details
//             // { header: "Place of Contact", key: "placeOfContact", width: 25 },
//             // { header: "Place of Contact with State Code", key: "placeOfContactWithStateCode", width: 30 },
//             // { header: "Contact Address ID", key: "contactAddressId", width: 25 },
//             // { header: "Source", key: "source", width: 20 },
//             // { header: "Owner Name", key: "ownerName", width: 20 },
//             // { header: "Primary Contact ID", key: "primaryContactId", width: 25 },
//             // { header: "Contact ID", key: "contactId", width: 20 },
//             // { header: "Contact Name", key: "contactName", width: 20 },
//             // { header: "Contact Type", key: "contactType", width: 20 },
//             // { header: "Last Sync Time", key: "lastSyncTime", width: 25 },
//         ];

//         let Enquiries = await Enquiry.find({}).lean().exec();

//         Enquiries.forEach((Enquiry) => {
//             console.log(Enquiry, "check enquiry")
//             worksheet.addRow({
//                 _id: Enquiry._id,
//                 displayName: Enquiry.name,
//                 phone: Enquiry.phone,
//                 email: Enquiry.email,


//                 // displayName: contact.displayName,
//                 // companyName: contact.companyName,
//                 // salutation: contact.salutation,
//                 // firstName: contact.firstName,
//                 // lastName: contact.lastName,
//                 // phone: contact.phone,
//                 // currencyCode: contact.currencyCode,
//                 // notes: contact.notes,
//                 // website: contact.website,
//                 // status: contact.status,
//                 // openingBalance: contact.openingBalance,
//                 // openingBalanceExchangeRate: contact.openingBalanceExchangeRate,
//                 // branchId: contact.branchId,
//                 // branchName: contact.branchName,
//                 // bankAccountPayment: contact.bankAccountPayment,
//                 // portalEnabled: contact.portalEnabled,
//                 // creditLimit: contact.creditLimit,
//                 // customerSubType: contact.customerSubType,
//                 // department: contact.department,
//                 // gstin: contact.gstin,
//                 // designation: contact.designation,
//             });
//         });


//         let filename = `${new Date().getTime()}.xlsx`
//         const filePath = path.join("public", "uploads", filename);
//         await workbook.xlsx.writeFile(`${filePath}`).then(() => {
//             res.send({
//                 status: "success",
//                 message: "file successfully downloaded",
//                 filename: filename,
//             });
//         });

//     } catch (error) {
//         next(error);
//     }
// };





export const convertRfp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ message: "Missing RFP ID" });
        }





        const rfp = await Rfp.findOne({ _id: req.params.id });
        if (!rfp) {
            throw new Error("RFP does not exist");
        }



        const existingQuoteToVendor = await QuotesFromVendors.findOne({ enquiryId: rfp.enquiryId }).lean().exec();
        if (existingQuoteToVendor) {
            return res.status(400).json({ message: "Quotes To vendor already exists for this enquiry" });
        }

        const enquiryId = req.params.id;
        if (!enquiryId) {
            return res.status(400).json({ message: "Enquiry ID is required" });
        }


        const enquiry = await Enquiry.find({ enquiryId: enquiryId }).exec();
        if (!enquiry) {
            return res.status(404).json({ message: "Enquiry not found" });
        }

        // const existingVendorQuotes = await Rfp.find({ enquiryId: rfp.enquiryId }).exec();
        // if (existingVendorQuotes) {
        //     throw new Error("Quotes from this RFP has already been created");
        // }
        // console.log("existingVendorQuotes", existingVendorQuotes)

        let quoteId;
        const lastQuoteId = await QuotesFromVendors.findOne().sort({ quotesId: -1 }).select("quotesId");
        quoteId = lastQuoteId ? lastQuoteId.quotesId.replace(/\d+$/, (num: any) => String(Number(num) + 1).padStart(num.length, '0')) : "Quotes000001";

        for (let vendor of rfp.vendorList) {
            const newQuote = new QuotesFromVendors({
                quotesId: quoteId,
                rfpId: rfp.rfpId || "",
                leadId: rfp.leadId || "",
                serviceType: rfp.serviceType || [],
                eventDetails: "",
                deadlineOfProposal: "",
                vendorList: vendor,
                additionalInstructions: "",
                status: "Quote received from vendor",
                enquiryId: rfp.enquiryId || "",
                amount: "",
                receivedDate: new Date(),
                displayName: rfp.displayName || "",
            });
            await newQuote.save();
        }



        const result = await Enquiry.findByIdAndUpdate(rfp.enquiryId, { status: "Quote received from vendor" });

        const result1 = await Rfp.updateOne(
            { enquiryId: rfp.enquiryId }, // Find by enquiryId
            { $set: { status: "Quote received from vendor", updatedAt: new Date() } } // Update status and timestamp
        );



        // Update Enquiry status to "Quote received from vendors"
        // if (rfp.enquiryId) {
        //     await Enquiry.findByIdAndUpdate(rfp.enquiryId, { status: "Quote received from vendor" });
        //     await Rfp.findByIdAndUpdate(rfp._id, { status: "Quote received from vendor" });
        // }
        // await rfp.save();

        // console.log("rfp---->",rfp)



        return res.status(200).json({ message: "RFP convert to Quote from Vendor  successfully" });
    } catch (error) {

        next(error);
    }
};

export const downloadExcelRfps = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const isSelectedExport =
      req.body.tickRows &&
      Array.isArray(req.body.tickRows) &&
      req.body.tickRows.length > 0;
  
    return ExportService.downloadFile(req, res, next, {
      model: Rfp,
      buildQuery: buildRfpQuery,
      formatData: formatRfpData,
      processFields: processRfpFields,
      filename: isSelectedExport ? "selected_rfps" : "rfps",
      worksheetName: isSelectedExport ? "Selected RFPs" : "All RFPs",
      title: isSelectedExport ? "Selected RFPs" : "RFP List",
    });
  };

  const buildRfpQuery = (req: Request) => {
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
  
    if (req.body.serviceType?.length > 0) {
      query.serviceType = { $in: req.body.serviceType };
    }
  
    if (req.body.leadId) {
      query.leadId = req.body.leadId;
    }
  
    if (req.body.dateFrom && req.body.dateTo) {
      query.createdAt = {
        $gte: new Date(req.body.dateFrom),
        $lte: new Date(req.body.dateTo),
      };
    }
  
    if (req.body.search) {
      query.$or = [
        { rfpId: { $regex: req.body.search, $options: "i" } },
        { displayName: { $regex: req.body.search, $options: "i" } },
        { fullName: { $regex: req.body.search, $options: "i" } },
      ];
    }
  
    return query;
  };

  const formatRfpData = (rfp: any) => {
    // Format event dates range
    const eventDates = rfp.eventDates?.map((event:any) => 
      `${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`
    ).join('\n') || '';
  
    // Format vendor list
    const vendors = rfp.vendorList?.map((v:any) => v.label).join(', ') || '';
  
    return {
      id: rfp._id,
      rfpId: rfp.rfpId,
      status: rfp.status,
      displayName: rfp.displayName,
      fullName: rfp.fullName,
      serviceTypes: rfp.serviceType?.join(', ') || '',
      eventDates,
      eventDetails: rfp.eventDetails,
      deadline: rfp.deadlineOfProposal ? new Date(rfp.deadlineOfProposal).toLocaleDateString() : '',
      vendors,
      additionalInstructions: rfp.additionalInstructions,
      createdAt: rfp.createdAt?.toLocaleDateString() || '',
      updatedAt: rfp.updatedAt?.toLocaleDateString() || '',
    };
  };

  const processRfpFields = (fields: string[]) => {
    const fieldMapping = {
      id: { key: "id", header: "ID", width: 20 },
      rfpId: { key: "rfpId", header: "RFP ID", width: 20 },
      status: { key: "status", header: "Status", width: 15 },
      displayName: { key: "displayName", header: "Display Name", width: 25 },
      fullName: { key: "fullName", header: "Full Name", width: 25 },
      serviceTypes: { key: "serviceTypes", header: "Service Types", width: 30 },
      eventDates: { key: "eventDates", header: "Event Dates", width: 25 },
      eventDetails: { key: "eventDetails", header: "Event Details", width: 40 },
      deadline: { key: "deadline", header: "Proposal Deadline", width: 20 },
      vendors: { key: "vendors", header: "Vendors", width: 40 },
      additionalInstructions: { key: "additionalInstructions", header: "Instructions", width: 50 },
      createdAt: { key: "createdAt", header: "Created At", width: 15 },
      updatedAt: { key: "updatedAt", header: "Updated At", width: 15 },
    };
  
    return fields.length === 0
      ? Object.values(fieldMapping)
      : fields
          .map((field) => fieldMapping[field as keyof typeof fieldMapping])
          .filter(Boolean);
  };

  export const downloadRfpTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("RFP Template", {
        pageSetup: { paperSize: 9, orientation: "landscape" },
      });
  
      // Define columns
      worksheet.columns = [
        { header: "RFP ID*", key: "rfpId", width: 20 },
        { header: "Display Name*", key: "displayName", width: 25 },
        { header: "Full Name*", key: "fullName", width: 25 },
        { header: "Service Types*", key: "serviceTypes", width: 30 },
        { header: "Start Date*", key: "startDate", width: 15 },
        { header: "End Date*", key: "endDate", width: 15 },
        { header: "Event Details", key: "eventDetails", width: 40 },
        { header: "Proposal Deadline*", key: "deadline", width: 20 },
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
      ['D2', 'I2'].forEach(cell => {
        worksheet.getCell(cell).dataValidation = {
          type: "list",
          allowBlank: cell === 'I2',
          formulae: [
            cell === 'D2' 
              ? '"Venue,Catering,Entertainment,Logistics,AV Equipment"'
              : '"Draft,Sent,In Review,Awarded,Closed"'
          ],
        };
      });
  
      // Add sample data
      const sampleDate = new Date();
      worksheet.addRow({
        rfpId: "RFP-" + Math.floor(1000 + Math.random() * 9000),
        displayName: "Annual Conference",
        fullName: "2023 Annual Corporate Conference",
        serviceTypes: "Venue, Catering",
        startDate: sampleDate.toISOString().split('T')[0],
        endDate: new Date(sampleDate.setDate(sampleDate.getDate() + 2)).toISOString().split('T')[0],
        deadline: new Date(sampleDate.setDate(sampleDate.getDate() + 7)).toISOString().split('T')[0],
        status: "Draft"
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
        { field: "RFP ID", description: "Unique RFP identifier", required: "Yes" },
        { field: "Display Name", description: "Short name for reference", required: "Yes" },
        { field: "Full Name", description: "Complete event name", required: "Yes" },
        { field: "Service Types", description: "Comma-separated list of required services", required: "Yes" },
        { field: "Start Date", description: "Event start date (YYYY-MM-DD)", required: "Yes" },
        { field: "End Date", description: "Event end date (YYYY-MM-DD)", required: "Yes" },
        { field: "Event Details", description: "Description of the event", required: "No" },
        { field: "Proposal Deadline", description: "Deadline for vendor responses (YYYY-MM-DD)", required: "Yes" },
        { field: "Status", description: "Current RFP status", required: "No" },
      ];
  
      instructions.forEach(inst => instructionSheet.addRow(inst));
  
      // Generate file
      const filename = `rfp_import_template_${Date.now()}.xlsx`;
      const filePath = path.join("public", "uploads", filename);
      
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await workbook.xlsx.writeFile(filePath);
  
      res.json({
        status: "success",
        message: "RFP template downloaded",
        filename,
      });
    } catch (error) {
      console.error("RFP template generation failed:", error);
      next(error);
    }
  };