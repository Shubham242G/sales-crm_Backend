import { NextFunction, Request, RequestHandler, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { Vendor } from "@models/vendor.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { deleteFileUsingUrl } from "@helpers/fileSystem";
import { SalesContact } from "@models/salesContact.model";
import { parse } from 'csv-parse'
import multer from "multer";
import xlsx from "xlsx";
import ExcelJs from "exceljs";
import fs from "fs";
import path from "path";
import { zohoRequest } from "@util/zoho";
import { IVendor } from "@models/vendor.model";
import { createObjectCsvWriter } from "csv-writer";
import { rgb, StandardFonts, StandardFontValues, PDFDocument } from "pdf-lib";


const upload = multer({ dest: "uploads/" });

export const addVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // let existsCheck = await Vendor.findOne({ name: req.body.firstName, lastName: req.body.lastName, email: req.body.email }).exec();
    // if (existsCheck) {
    //   throw new Error("Vendor with same email first name, last name and Email already exists");
    // }
    // console.log(req.body.vendor, "req.body");

    if (req?.body?.rooms) {
      for (let i = 0; i < req.body.rooms.length; i++) {
        const room = req.body.rooms[i];
        if (room.roomImageUpload) {
          for (let j = 0; j < room.roomImageUpload.length; j++) {
            if (room.roomImageUpload[j].includes("base64")) {
              room.roomImageUpload[j] = await storeFileAndReturnNameBase64(
                room.roomImageUpload[j]
              );
            }
          }
        }
      }
    }

    if (req?.body?.banquets) {
      for (let i = 0; i < req.body.banquets.length; i++) {
        const banquets = req.body.banquets[i];
        if (banquets.banquetImageUpload) {
          for (let j = 0; j < banquets.banquetImageUpload.length; j++) {
            if (banquets.banquetImageUpload[j].includes("base64")) {
              banquets.banquetImageUpload[j] =
                await storeFileAndReturnNameBase64(
                  banquets.banquetImageUpload[j]
                );
            }
          }
        }
      }
    }

    if (req?.body?.restaurant && req?.body?.restaurant?.restaurantImageUpload?.length > 0) {


      for (
        let i = 0;
        i < req?.body?.restaurant?.restaurantImageUpload?.length;
        i++
      ) {


        if (
          req?.body?.restaurant?.restaurantImageUpload[i] &&
          req.body.restaurant.restaurantImageUpload[i].includes("base64")
        ) {
          req.body.restaurant.restaurantImageUpload[i] =
            await storeFileAndReturnNameBase64(
              req.body.restaurant.restaurantImageUpload[i]
            );
        }
      }
    }

    if (req?.body?.otherDetails?.documents && req.body.otherDetails.documents.length > 0) {
      for (let i = 0; i < req.body.otherDetails.documents.length; i++) {
        if (
          req?.body?.otherDetails?.documents[i] &&
          req?.body?.otherDetails?.documents[i].includes("base64")
        ) {
          req.body.otherDetails.documents[i] = await storeFileAndReturnNameBase64(
            req.body.otherDetails.documents[i]
          );

        }
      }
    }
    await new Vendor(req.body).save();
    res.status(201).json({ message: "Vendor Created" });
  } catch (error) {
    next(error);
  }
};

//  
//     try {
//         const response = await zohoRequest('vendors');
//         const zohoVendor = response.vendor || [];

//         let created = 0;
//         let updated = 0;

//         for (const cust of zohoVendor) {
//             const sanitized = sanitizeZohoVendor(cust);

//             const existing = await Vendor.findOne({ "vendor.email": sanitized.vendor.email });
//             if (!existing) {
//                 await Vendor.create(sanitized);
//                 created++;
//             } else {
//                 await Vendor.updateOne({ "vendor.email": sanitized.vendor.email }, { $set: sanitized });
//                 updated++;
//             }
//         }

//         res.status(200).json({
//             success: true,
//             message: `${created} vendor created, ${updated} updated.`,
//             created,
//             updated,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// Helper for saving Zoho vendor
// const processAndSaveVendor = async (vendor: any[]) => {
//     for (const cust of vendor) {
//         const sanitized = sanitizeZohoCustomer(cust);
//         await Customer.updateOne({ email: sanitized.email }, { $set: sanitized }, { upsert: true });
//     }
// };

// Zoho to Mongo field mapping
// export const sanitizeZohoVendor = (cust: any) => {
//   const vendorData = {
//     vendor: {
//       salutation: cust.salutation || '',
//       firstName: cust.first_name || '',
//       lastName: cust.last_name || '',
//       email: cust.email || '',
//       companyName: cust.company_name || '',
//       contactName: cust.display_name || '',
//       contactOwner: '', // Will need manual mapping
//       panNumber: cust.pan_no || '',
//       gst: cust.gst_no || '',
//       vendorType: [], // Might require classification logic
//       landLine: cust.phone || '',
//       phoneNumber: cust.mobile || '',
//       displayName: cust.display_name || '',
//     },

//     isBanquetDetailsVisible: false,
//     isRestaurantDetailsVisible: false,

//     location: {
//       state: cust.billing_address?.state || '',
//       city: cust.billing_address?.city || '',
//       area: '',
//       address: cust.billing_address?.address || '',
//     },

//     category: {
//       categoryType: '',
//     },

//     rooms: [],
//     banquets: [],
//     restaurant: {
//       restaurantMenuType: [],
//       restaurantImageUpload: [],
//       restaurantCovers: '',
//       restaurantFloor: '',
//       restaurantSwimmingPool: '',
//     },

//     bankDetails: {
//       bankName: '',
//       bankAccountNumber: '',
//       ifsc: '',
//       pointOfContact: '',
//       email: '',
//       phoneNumber: '',
//       billingAddress: '',
//     },

//     eventServices: [],
//     eventLocation: {
//       state: '',
//       city: '',
//       area: '',
//       serviceAreas: [],
//     },

//     transportLocation: {
//       state: '',
//       city: '',
//       travelLocal: false,
//       travelOutStation: false,
//       serviceAreas: [],
//       carDetails: [],
//     },

//     otherDetails: {
//       sourceOfSupply: '',
//       gstTreatment: cust.gst_treatment || '',
//       gstin: cust.gst_no || '',
//       pan: cust.pan_no || '',
//       msmeRegistered: false,
//       currency: cust.currency_code || '',
//       openingBalanceState: cust.opening_balance_type || '',
//       openingBalance: cust.opening_balance || '0',
//       creditLimit: cust.credit_limit || '0',
//       paymentTerms: cust.payment_terms || '',
//       tds: '',
//       priceList: cust.price_list_id || '',
//       enablePortal: cust.portal_status === 'active',
//       portalLanguage: cust.language_code || 'en',
//       documents: [],
//       websiteUrl: cust.website || '',
//       department: cust.department || '',
//       designation: cust.designation || '',
//       twitter: '',
//       facebook: '',
//       skype: '',
//     },

//     billingAddress: {
//       addressId: new Types.ObjectId(), // or fetch actual related address id
//       billingCountry: cust.billing_address?.country || '',
//       billingAddressStreet1: cust.billing_address?.address || '',
//       billingAddressStreet2: '',
//       billingCity: cust.billing_address?.city || '',
//       billingState: cust.billing_address?.state || '',
//       billingPincode: cust.billing_address?.zip || '',
//       billingPhone: cust.billing_address?.phone || '',
//       billingFaxNumber: cust.billing_address?.fax || '',
//     },

//     shippingAddress: {
//       shippingCountry: cust.shipping_address?.country || '',
//       shippingAddressStreet1: cust.shipping_address?.address || '',
//       shippingAddressStreet2: '',
//       shippingCity: cust.shipping_address?.city || '',
//       shippingState: cust.shipping_address?.state || '',
//       shippingPincode: cust.shipping_address?.zip || '',
//       shippingPhone: cust.shipping_address?.phone || '',
//       shippingFaxNumber: cust.shipping_address?.fax || '',
//     },

//     contactPersons: (cust.contact_persons || []).map((person:any) => ({
//       salutation: person.salutation || '',
//       contactPersonId: new Types.ObjectId(),
//       contactPersonFirstName: person.first_name || '',
//       contactPersonLastName: person.last_name || '',
//       contactPersonEmail: person.email || '',
//       contactPersonWorkPhone: person.phone || '',
//       contactPersonMobilePhone: person.mobile || '',
//       contactPersonMobile: person.mobile || '',
//     })),
//   };

//   return vendorData;
// };



const processAndSaveVendor = async (vendor: any[]) => {
    const createdCount = 0;
    const updatedCount = 0;

    for (const cust of vendor) {
        const sanitizedCustomer: any = {
            customerType: cust.customer_type || 'Business',
            salutation: cust.salutation || '',
            firstName: cust.first_name || '',
            lastName: cust.last_name || '',
            companyName: cust.company_name || '',
            displayName: cust.display_name || '',
            email: cust.email || '',
            workPhone: cust.phone || '',
            mobile: cust.mobile || '',
            panNumber: cust.pan_no || '',
            placeOfSupply: cust.place_of_supply || '',
            prefersEmail: cust.prefered_email || false,
            prefersSms: cust.prefered_sms || false,
            gstTreatment: cust.gst_treatment || '',
            taxPreference: cust.tax_type || 'Taxable',
            currency: cust.currency_code || '',
            paymentTerms: cust.payment_terms || '',
            priceList: cust.price_list_id || '',
            enablePortal: cust.portal_status === 'active',
            portalLanguage: cust.language_code || 'en',
            openingBalanceState: cust.opening_balance_type || '',
            openingBalance: cust.opening_balance || '0',
            creditLimit: cust.credit_limit || '0',
            countryRegion: cust.billing_address?.country || '',
            addressStreet1: cust.billing_address?.address || '',
            addressStreet2: '',
            city: cust.billing_address?.city || '',
            state: cust.billing_address?.state || '',
            phoneNumber: cust.phone || '',
            pinCode: cust.billing_address?.zip || '',
            faxNumber: cust.billing_address?.fax || '',
            shippingCountryRegion: cust.shipping_address?.country || '',
            shippingAddressStreet1: cust.shipping_address?.address || '',
            shippingAddressStreet2: '',
            shippingCity: cust.shipping_address?.city || '',
            shippingState: cust.shipping_address?.state || '',
            shippingPhoneNumber: cust.shipping_address?.phone || '',
            shippingPinCode: cust.shipping_address?.zip || '',
            shippingFaxNumber: cust.shipping_address?.fax || '',
            contactPersons: cust.contact_persons || [],
            documentArray: [],
            websiteUrl: cust.website || '',
            department: cust.department || '',
            designation: cust.designation || '',
            twitter: '',
            skype: '',
            facebook: ''
        };

        // Upsert operation - creates if not exists, updates if exists
        await Vendor.updateOne(
            { email: cust.email },
            { $set: sanitizedCustomer },
            { upsert: true }
        );



    }
};




export const getAllVendor = async (req: any, res: any, next: any) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};


    if (req.query.query && req.query.query !== "") {
      matchObj["location.state"] = new RegExp(req.query.query, "i");

    }

    pipeline.push({
      $match: matchObj,
    });
    let vendorArr = await paginateAggregate(Vendor, pipeline, req.query);

    res.status(201).json({
      message: "found all Device",
      data: vendorArr.data,
      total: vendorArr.total,
    });
  } catch (error) {
    next(error);
  }
};



export const getVendorById = async (
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
    let existsCheck = await Vendor.aggregate(pipeline);
    if (!existsCheck || existsCheck.length == 0) {
      throw new Error("Vendor does not exists");
    }
    existsCheck = existsCheck[0];
    res.status(201).json({
      message: "found specific VENDOR",
      data: existsCheck,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVendorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await Vendor.findById(req.params.id).lean().exec();
    if (!existsCheck) {
      throw new Error("Vendor does not exists");
    }


    if (req?.body?.rooms) {
      for (let i = 0; i < req.body.rooms.length; i++) {
        const room = req.body.rooms[i];
        if (room.roomImageUpload) {
          for (let j = 0; j < room.roomImageUpload.length; j++) {
            if (room.roomImageUpload[j].includes("base64")) {
              room.roomImageUpload[j] = await storeFileAndReturnNameBase64(
                room.roomImageUpload[j]
              );
              await deleteFileUsingUrl(
                `uploads/${existsCheck?.rooms?.[i].roomImageUpload[j]}`
              );
            }
          }
        }
      }
    }


    if (req?.body?.banquets) {
      for (let i = 0; i < req.body.banquets.length; i++) {
        const banquets = req.body.banquets[i];
        if (banquets.banquetImageUpload) {
          for (let j = 0; j < banquets.banquetImageUpload.length; j++) {
            if (banquets.banquetImageUpload[j].includes("base64")) {
              banquets.banquetImageUpload[j] =
                await storeFileAndReturnNameBase64(
                  banquets.banquetImageUpload[j]
                );
              await deleteFileUsingUrl(
                `uploads/${existsCheck?.banquets?.[i].banquetImageUpload[j]}`
              );
            }
          }
        }
      }
    }


    if (req?.body?.restaurant && req?.body?.restaurant?.restaurantImageUpload?.length > 0) {

      for (
        let i = 0;
        i < req?.body?.restaurant?.restaurantImageUpload?.length;
        i++
      ) {

        if (
          req?.body?.restaurant?.restaurantImageUpload[i] &&
          req.body.restaurant.restaurantImageUpload[i].includes("base64")
        ) {
          req.body.restaurant.restaurantImageUpload[i] =
            await storeFileAndReturnNameBase64(
              req.body.restaurant.restaurantImageUpload[i]
            );
          await deleteFileUsingUrl(
            `uploads/${existsCheck?.restaurant?.restaurantImageUpload[i]}`
          );
        }
      }
    }

    if (req?.body?.otherDetails?.documents && req.body.otherDetails.documents.length > 0) {
      for (let i = 0; i < req.body.otherDetails.documents.length; i++) {
        if (
          req?.body?.otherDetails?.documents[i] &&
          req?.body?.otherDetails?.documents[i].includes("base64")
        ) {
          req.body.otherDetails.documents[i] = await storeFileAndReturnNameBase64(
            req.body.otherDetails.documents[i]
          );
          await deleteFileUsingUrl(
            `uploads/${existsCheck?.otherDetails?.documents[i]}`
          );
        }
      }
    }
    let Obj = await Vendor.findByIdAndUpdate(req.params.id, req.body).exec();
    res.status(201).json({ message: "Vendor Updated" });
  } catch (error) {
    next(error);
  }
};



export const bulkUpload: RequestHandler = async (req, res, next) => {
  try {
    const file = req.file?.path;
    if (!file) throw new Error("File not uploaded");

    const workbook = xlsx.readFile(file);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const success = [];
    const errors = [];
    const vendorsToInsert: any[] = [];

    // Step 1: Validate and prepare data
    for (const [i, row] of sheetData.entries()) {
      try {
        const typedRow = row as Record<string, any>;
        if (!typedRow["Company Name"] || !typedRow["EmailID"]) {
          errors.push({ row: i + 2, error: "Missing Company Name or EmailID" });
          continue;
        }

        const vendorData = {
          vendor: {
            salutation: typedRow["Salutation"] || "",
            firstName: typedRow["First Name"] || "",
            lastName: typedRow["Last Name"] || "",
            email: typedRow["EmailID"],
            companyName: typedRow["Company Name"],
            contactName: typedRow["Contact Name"] || "",
            contactOwner: typedRow["Owner Name"] || "", // Mapping "Owner Name" if applicable
            panNumber: typedRow["MSME/Udyam No"] || typedRow["PAN"] || "", // Use MSME or other PAN if available
            gst: typedRow["GST Identification Number (GSTIN)"] || "",
            vendorType: typedRow["Vendor Type"] ? typedRow["Vendor Type"].split(",").map((v: any) => v.trim()) : [],
            landLine: typedRow["Phone"] || "",
            phoneNumber: typedRow["MobilePhone"] || "",
            displayName: typedRow["Display Name"] || typedRow["Company Name"],
          },
          location: {
            state: typedRow["Billing State"] || "",
            city: typedRow["Billing City"] || "",
            area: typedRow["Billing Street2"] || "", // Using Street2 as area if needed
            address: typedRow["Billing Address"] || "",
          },
          bankDetails: {
            bankName: typedRow["Vendor Bank Name"] || "",
            bankAccountNumber: typedRow["Vendor Bank Account Number"] || "",
            ifsc: typedRow["Vendor Bank Code"] || "",
            pointOfContact: typedRow["Beneficiary Name"] || "", // Mapping to Beneficiary Name
            email: typedRow["Bank Email"] || "", // Not in file, default to empty
            phoneNumber: typedRow["Bank Phone"] || "", // Not in file, default to empty
            billingAddress: typedRow["Billing Address"] || "",
          },
          otherDetails: {
            sourceOfSupply: typedRow["Source of Supply"] || "",
            gstTreatment: typedRow["GST Treatment"] || "",
            gstin: typedRow["GST Identification Number (GSTIN)"] || "",
            pan: typedRow["MSME/Udyam No"] || typedRow["PAN"] || "",
            msmeRegistered: typedRow["MSME/Udyam No"] ? true : false, // Infer from presence of MSME No
            websiteUrl: typedRow["Website"] || "",
            facebook: typedRow["Facebook"] || "",
            twitter: typedRow["Twitter"] || "",
            skype: typedRow["Skype Identity"] || "",
          },
          category: {
            categoryType: typedRow["Department"] || "", // Mapping "Department" as category if applicable
          },
          billingAddress: {
            billingCountry: typedRow["Billing Country"] || "",
            billingAddressStreet1: typedRow["Billing Address"] || "",
            billingAddressStreet2: typedRow["Billing Street2"] || "",
            billingCity: typedRow["Billing City"] || "",
            billingState: typedRow["Billing State"] || "",
            billingPincode: typedRow["Billing Code"] || "",
            billingPhone: typedRow["Billing Phone"] || "",
            billingFaxNumber: typedRow["Billing Fax"] || "",
          },
          shippingAddress: {
            shippingCountry: typedRow["Shipping Country"] || "",
            shippingAddressStreet1: typedRow["Shipping Address"] || "",
            shippingAddressStreet2: typedRow["Shipping Street2"] || "",
            shippingCity: typedRow["Shipping City"] || "",
            shippingState: typedRow["Shipping State"] || "",
            shippingPincode: typedRow["Shipping Code"] || "",
            shippingPhone: typedRow["Shipping Phone"] || "",
            shippingFaxNumber: typedRow["Shipping Fax"] || "",
          },
          isBanquetDetailsVisible: false, // Default value
          isRestaurantDetailsVisible: false, // Default value
          // Add other fields as needed based on your schema
        };

        // Clean up multi-line addresses
        if (vendorData.location.address) {
          vendorData.location.address = vendorData.location.address.replace(/\n/g, " ").trim();
        }
        if (vendorData.billingAddress.billingAddressStreet1) {
          vendorData.billingAddress.billingAddressStreet1 = vendorData.billingAddress.billingAddressStreet1.replace(/\n/g, " ").trim();
        }
        if (vendorData.shippingAddress.shippingAddressStreet1) {
          vendorData.shippingAddress.shippingAddressStreet1 = vendorData.shippingAddress.shippingAddressStreet1.replace(/\n/g, " ").trim();
        }

        // Check for duplicates within the Excel file
        const isDuplicateInExcel = vendorsToInsert.some(
          (v) =>
            v.vendor.email === vendorData.vendor.email ||
            v.vendor.companyName === vendorData.vendor.companyName
        );
        if (isDuplicateInExcel) {
          errors.push({
            row: i + 2,
            error: "Duplicate vendor (email or company name) in Excel file",
          });
          continue;
        }

        // Check for duplicates in the database
        const existing = await Vendor.findOne({
          $or: [
            { "vendor.email": vendorData.vendor.email },
            { "vendor.companyName": vendorData.vendor.companyName },
          ],
        });

        if (existing) {
          errors.push({
            row: i + 2,
            error: "Duplicate vendor (email or company name) in database",
          });
          continue;
        }

        vendorsToInsert.push(vendorData);
        success.push({ row: i + 2, message: "Vendor queued for insertion" });
      } catch (err: any) {
        errors.push({ row: i + 2, error: err.message || "Unknown error" });
      }
    }

    // Step 2: Insert all valid vendors at once
    if (vendorsToInsert.length > 0) {
      try {
        await Vendor.insertMany(vendorsToInsert, { ordered: false });
      } catch (insertErr: any) {
        // If insertMany fails, mark all queued successes as errors
        success.forEach((s, idx) => {
          errors.push({
            row: s.row,
            error: `Failed to insert: ${insertErr.message}`,
          });
          success[idx] = null; // Clear success entry
        });
      }
    }

    // Filter out null success entries
    const validSuccess = success.filter((s) => s !== null);

    res.status(200).json({
      message: "Bulk import complete",
      successCount: validSuccess.length,
      errorCount: errors.length,
      errors,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const deleteVendorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await Vendor.findById(req.params.id).exec();
    if (!existsCheck) {
      throw new Error("Vendor does not exists or already deleted");
    }
    await deleteFileUsingUrl(`uploads/${existsCheck.otherDetails.documents}`);
    await Vendor.findByIdAndDelete(req.params.id).exec();
    res.status(201).json({ message: "Vendor Deleted" });
  } catch (error) {
    next(error);
  }
};

export const convertVendorToSalesContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const vendorId = req.params.id;

    const vendor = await Vendor.findById(vendorId).lean().exec();
    if (!vendor) {
      throw new Error("Vendor does not exist");
    }

    const salesContactData = {
      salutation: vendor.vendor.salutation || "",
      firstName: vendor.vendor.firstName || "",
      lastName: vendor.vendor.lastName || "",
      email: vendor.vendor.email || "",
      phone: vendor.vendor.phoneNumber || "",
      company: vendor.vendor.companyName || "",
      vendorId: vendor._id,
      state: vendor.location.state || "",
      city: vendor.location.city || "",
      area: vendor.location.area || "",
      phoneNumber: vendor.vendor.phoneNumber || "",
    };

    const newSalesContact = await new SalesContact(salesContactData).save();

    res.status(201).json({
      message: "Vendor successfully converted to Sales Contact",
      data: newSalesContact,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllVendorName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Fetch only required fields from the database
    const vendors = await Vendor.find(
      {},
      "vendor.displayName"
    ).lean();


    // Transforming the vendor list
    const vendorNames = vendors.map((v: any) => ({
      Name: `${v.vendor.displayName}`,
    }));


    res.status(200).json({
      message: "Found all vendor names",
      data: vendorNames,
      total: vendorNames.length,
    });
  } catch (error) {
    next(error);
  }
};

//Export 

const FIELD_MAPPING = {
  _id: { header: 'ID', width: 22 },
  name: { header: 'Vendor Name', width: 20 },
  contactPerson: { header: 'Contact Person', width: 20 },
  phone: { header: 'Phone', width: 15 },
  email: { header: 'Email', width: 25 },
  address: { header: 'Address', width: 30 },
  category: { header: 'Category', width: 15 },
  status: { header: 'Status', width: 15 },
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
      { name: searchRegex },
      { contactPerson: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { address: searchRegex },
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
          else if (key === 'category' || key === 'status') {
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


const formatVendorData = (vendor: any) => {
  return {
    ...vendor,
    // Format dates
    createdAt: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : '',
    updatedAt: vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleDateString() : '',
    // Format other fields as needed
  };
};


export const downloadExcelVendor = async (req: Request, res: Response, next: NextFunction) => {
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

    // Get vendors from database
    const vendors = await Vendor.find(query).lean().exec();

    // Format date fields and process data
    const formattedVendors = vendors.map(formatVendorData);

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

    switch (format.toLowerCase()) {
      case 'csv':
        filename = await exportToCsv(formattedVendors, exportFields, directory, timestamp);
        break;
      case 'pdf':
        filename = await exportToPdf(formattedVendors, exportFields, directory, timestamp);
        break;
      case 'xlsx':
      default:
        filename = await exportToExcel(formattedVendors, exportFields, directory, timestamp);
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
  vendors: any[], 
  fields: any[], 
  directory: string, 
  timestamp: number
): Promise<string> => {
  // Create a new workbook and worksheet
  const workbook = new ExcelJs.Workbook();
  const worksheet = workbook.addWorksheet("Vendors", {
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
  vendors.forEach(vendors => {
    const rowData: any = {};
    fields.forEach(field => {
      rowData[field.key] = vendors[field.key] !== undefined ? vendors[field.key] : '';
    });
    worksheet.addRow(rowData);
  });
  
  // Add borders to all cells
  worksheet.eachRow({ includeEmpty: true }, (row:any) => {
    row.eachCell({ includeEmpty: true }, (cell:any) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  // Write the file
  const filename = `vendors_export_${timestamp}.xlsx`;
  const filePath = path.join(directory, filename);
  await workbook.xlsx.writeFile(filePath);
  
  return filename;
};

const exportToPdf = async (
  vendors: any[], 
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
  page.drawText('Vendors Export', {
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
  for (const vendor of vendors) {
    // Check if we need a new page
    if (currentRow >= rowsPerPage) {
      // Add new page
      const newPage = pdfDoc.addPage([842, 595]);
      page.drawText('Vendors Export (continued)', {
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
      const value = vendor[field.key] !== undefined ? String(vendor[field.key]) : '';
      
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
  const filename = `vendors_export_${timestamp}.pdf`;
  const filePath = path.join(directory, filename);
  const pdfBytes = await pdfDoc.save();
  
  fs.writeFileSync(filePath, pdfBytes);
  
  return filename;
};



const exportToCsv = async (
  vendors: any[], 
  fields: any[], 
  directory: string, 
  timestamp: number
): Promise<string> => {
  // Create CSV writer
  const filename = `vendors_export_${timestamp}.csv`;
  const filePath = path.join(directory, filename);
  
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: fields.map(field => ({
      id: field.key,
      title: field.header
    }))
  });
  
  // Write data
  await csvWriter.writeRecords(vendors);
  
  return filename;
};





export const downloadVendorTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workbook = new ExcelJs.Workbook();

    // ====== VENDOR TEMPLATE SHEET ======
    const worksheet = workbook.addWorksheet("Vendor Template", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    worksheet.columns = [
      { header: "Vendor Name*", key: "name", width: 20 },
      { header: "Contact Person", key: "contactPerson", width: 20 },
      { header: "Email*", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Address", key: "address", width: 30 },
      { header: "Category", key: "category", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Example row
    worksheet.addRow({
      name: "ABC Supplies",
      contactPerson: "Jane Doe",
      email: "jane.doe@abc.com",
      phone: "1234567890",
      address: "123 Main St, City",
      category: "Electronics",
      status: "Active"
    });

    // Data validation dropdowns
    worksheet.getCell("F2").dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Electronics,Stationery,Furniture,Other"']
    };

    worksheet.getCell("G2").dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Active,Inactive"']
    };

    // ====== INSTRUCTIONS SHEET ======
    const instructionSheet = workbook.addWorksheet("Instructions");

    instructionSheet.columns = [
      { header: "Field", key: "field", width: 20 },
      { header: "Description", key: "description", width: 50 },
      { header: "Required", key: "required", width: 10 },
    ];

    const instHeaderRow = instructionSheet.getRow(1);
    instHeaderRow.font = { bold: true };
    instHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const instructions = [
      { field: "Vendor Name", description: "Name of the vendor", required: "Yes" },
      { field: "Contact Person", description: "Primary contact person at the vendor", required: "No" },
      { field: "Email", description: "Vendor's email address", required: "Yes" },
      { field: "Phone", description: "Vendor's phone number", required: "No" },
      { field: "Address", description: "Vendor's address", required: "No" },
      { field: "Category", description: "Category of products/services provided", required: "No" },
      { field: "Status", description: "Current status of the vendor (Active, Inactive)", required: "No" },
    ];

    instructions.forEach(row => instructionSheet.addRow(row));

    // ====== STREAM FILE TO CLIENT ======
    const timestamp = new Date().getTime();
    const filename = `vendor_import_template_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.status(200).end();

  } catch (error) {
    console.error("Error generating Excel template:", error);
    next(error);
  }
};