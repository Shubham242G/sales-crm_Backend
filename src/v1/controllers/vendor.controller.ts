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
import fs from "fs";
import path from "path";
import PDFDocument from 'pdfkit';
import { zohoRequest } from "../../util/zoho";
import { IVendor } from "@models/vendor.model";
import { create } from "lodash";
import { ExportService } from "../../util/excelfile";
import ExcelJs from "exceljs";


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
export const sanitizeZohoVendor = (cust: any) => {
  const vendorData = {
    vendor: {
      salutation: cust.salutation || '',
      firstName: cust.first_name || '',
      lastName: cust.last_name || '',
      email: cust.email || '',
      companyName: cust.company_name || '',
      contactName: cust.display_name || '',
      contactOwner: '', // Will need manual mapping
      panNumber: cust.pan_no || '',
      gst: cust.gst_no || '',
      vendorType: [], // Might require classification logic
      landLine: cust.phone || '',
      phoneNumber: cust.mobile || '',
      displayName: cust.display_name || '',
    },

    isBanquetDetailsVisible: false,
    isRestaurantDetailsVisible: false,

    location: {
      state: cust.billing_address?.state || '',
      city: cust.billing_address?.city || '',
      area: '',
      address: cust.billing_address?.address || '',
    },

    category: {
      categoryType: '',
    },

    rooms: [],
    banquets: [],
    restaurant: {
      restaurantMenuType: [],
      restaurantImageUpload: [],
      restaurantCovers: '',
      restaurantFloor: '',
      restaurantSwimmingPool: '',
    },

    bankDetails: {
      bankName: '',
      bankAccountNumber: '',
      ifsc: '',
      pointOfContact: '',
      email: '',
      phoneNumber: '',
      billingAddress: '',
    },

    eventServices: [],
    eventLocation: {
      state: '',
      city: '',
      area: '',
      serviceAreas: [],
    },

    transportLocation: {
      state: '',
      city: '',
      travelLocal: false,
      travelOutStation: false,
      serviceAreas: [],
      carDetails: [],
    },

    otherDetails: {
      sourceOfSupply: '',
      gstTreatment: cust.gst_treatment || '',
      gstin: cust.gst_no || '',
      pan: cust.pan_no || '',
      msmeRegistered: false,
      currency: cust.currency_code || '',
      openingBalanceState: cust.opening_balance_type || '',
      openingBalance: cust.opening_balance || '0',
      creditLimit: cust.credit_limit || '0',
      paymentTerms: cust.payment_terms || '',
      tds: '',
      priceList: cust.price_list_id || '',
      enablePortal: cust.portal_status === 'active',
      portalLanguage: cust.language_code || 'en',
      documents: [],
      websiteUrl: cust.website || '',
      department: cust.department || '',
      designation: cust.designation || '',
      twitter: '',
      facebook: '',
      skype: '',
    },

    billingAddress: {
      addressId: cust.billing_address?.id || '',
      // addressId: new Types.ObjectId(), // or fetch actual related address id
      billingCountry: cust.billing_address?.country || '',
      billingAddressStreet1: cust.billing_address?.address || '',
      billingAddressStreet2: '',
      billingCity: cust.billing_address?.city || '',
      billingState: cust.billing_address?.state || '',
      billingPincode: cust.billing_address?.zip || '',
      billingPhone: cust.billing_address?.phone || '',
      billingFaxNumber: cust.billing_address?.fax || '',
    },

    shippingAddress: {
      shippingCountry: cust.shipping_address?.country || '',
      shippingAddressStreet1: cust.shipping_address?.address || '',
      shippingAddressStreet2: '',
      shippingCity: cust.shipping_address?.city || '',
      shippingState: cust.shipping_address?.state || '',
      shippingPincode: cust.shipping_address?.zip || '',
      shippingPhone: cust.shipping_address?.phone || '',
      shippingFaxNumber: cust.shipping_address?.fax || '',
    },

    contactPersons: (cust.contact_persons || []).map((person: any) => ({
      salutation: person.salutation || '',
      contactPersonId: person.contact_person_id || '',
      contactPersonFirstName: person.first_name || '',
      contactPersonLastName: person.last_name || '',
      contactPersonEmail: person.email || '',
      contactPersonWorkPhone: person.phone || '',
      contactPersonMobilePhone: person.mobile || '',
      contactPersonMobile: person.mobile || '',
    })),
  };

  return vendorData;
};



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

    let vendorArr = await paginateAggregate(Vendor, pipeline, req.query);

    res.status(201).json({
      message: "found all Device",
      data: vendorArr.data,
      total: vendorArr.total,
    });
  }
  catch (error) {
    next(error);
  }
}


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
      {
        "vendor.firstName": 1,
        "vendor.lastName": 1,
        "vendor.email": 1,
        "vendor.companyName": 1,
        _id: 1,
      }
    ).lean();

    console.log(vendors, "check vendor")


    // Transforming the vendor list
    const vendorNames = vendors.map(({ _id, vendor: { firstName, lastName, companyName } }: any) => ({
      _id,
      Name: companyName

    }));

    console.log(vendorNames, "vendorNames");


    res.status(200).json({
      message: "Found all vendor names",
      data: vendorNames,
      total: vendorNames.length,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadExcelVendors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isSelectedExport =
    req.body.tickRows &&
    Array.isArray(req.body.tickRows) &&
    req.body.tickRows.length > 0;

  return ExportService.downloadFile(req, res, next, {
    model: Vendor,
    buildQuery: buildVendorQuery,
    formatData: formatVendorData,
    processFields: processVendorFields,
    filename: isSelectedExport ? "selected_vendors" : "vendors",
    worksheetName: isSelectedExport ? "Selected Vendors" : "All Vendors",
    title: isSelectedExport ? "Selected Vendors" : "Vendor Directory",
  });
};

const buildVendorQuery = (req: Request) => {
  const query: any = {};

  // Handle selected rows export
  if (req.body.tickRows?.length > 0) {
    query._id = { $in: req.body.tickRows };
    return query;
  }

  // Apply regular filters
  if (req.body.vendorType) {
    query['vendor.vendorType'] = { $in: [req.body.vendorType] };
  }

  if (req.body.state) {
    query['location.state'] = req.body.state;
  }

  if (req.body.categoryType) {
    query['category.categoryType'] = req.body.categoryType;
  }

  if (req.body.dateFrom && req.body.dateTo) {
    query.createdAt = {
      $gte: new Date(req.body.dateFrom),
      $lte: new Date(req.body.dateTo),
    };
  }

  if (req.body.search) {
    query.$or = [
      { 'vendor.companyName': { $regex: req.body.search, $options: "i" } },
      { 'vendor.displayName': { $regex: req.body.search, $options: "i" } },
      { 'vendor.email': { $regex: req.body.search, $options: "i" } },
      { 'location.city': { $regex: req.body.search, $options: "i" } },
    ];
  }

  return query;
};

const formatVendorData = (vendor: IVendor) => {
  // Helper function to format arrays
  const formatArray = (arr: any[], prop: string) =>
    arr?.map(item => item[prop]).join(', ') || '';

  return {
    // Basic Vendor Info

    companyName: vendor.vendor?.companyName,
    displayName: vendor.vendor?.displayName,
    contactName: vendor.vendor?.contactName,
    email: vendor.vendor?.email,
    phone: vendor.vendor?.phoneNumber,

    // Location
    location: `${vendor.location?.address}, ${vendor.location?.city}, ${vendor.location?.state}`,

    // Category
    category: vendor.category?.categoryType,

    // Financial
    gst: vendor.vendor?.gst,
    pan: vendor.vendor?.panNumber,

    // Room Details (Summarized)
    roomCategories: formatArray(vendor.rooms || [], 'roomCategory'),
    totalRooms: vendor.rooms?.reduce((sum, room) => sum + (room.numberOfRooms || 0), 0),

    // Banquet Details (Summarized)
    banquetCategories: formatArray(vendor.banquets || [], 'banquetCategory'),
    totalBanquets: vendor.banquets?.length,

    // Restaurant Details
    restaurantMenuTypes: formatArray(vendor.restaurant?.restaurantMenuType || [], ''),
    restaurantCovers: vendor.restaurant?.restaurantCovers,

    // Bank Details
    bankName: vendor.bankDetails?.bankName,
    accountNumber: vendor.bankDetails?.bankAccountNumber,

    // Contact Persons
    contactPersons: vendor.contactPersons?.map(p =>
      `${p.contactPersonFirstName} ${p.contactPersonLastName}`).join(', '),


  };
};

const processVendorFields = (fields: string[]) => {
  const fieldMapping = {
    // Basic Info
    id: { key: "id", header: "ID", width: 20 },
    companyName: { key: "companyName", header: "Company", width: 30 },
    displayName: { key: "displayName", header: "Display Name", width: 25 },
    contactName: { key: "contactName", header: "Contact", width: 25 },
    email: { key: "email", header: "Email", width: 30 },
    phone: { key: "phone", header: "Phone", width: 20 },

    // Location
    location: { key: "location", header: "Address", width: 40 },

    // Category
    category: { key: "category", header: "Category", width: 20 },

    // Financial
    gst: { key: "gst", header: "GST", width: 20 },
    pan: { key: "pan", header: "PAN", width: 20 },

    // Rooms
    roomCategories: { key: "roomCategories", header: "Room Types", width: 30 },
    totalRooms: { key: "totalRooms", header: "Total Rooms", width: 15 },

    // Banquets
    banquetCategories: { key: "banquetCategories", header: "Banquet Types", width: 30 },
    totalBanquets: { key: "totalBanquets", header: "Total Banquets", width: 15 },

    // Restaurant
    restaurantMenuTypes: { key: "restaurantMenuTypes", header: "Menu Types", width: 30 },
    restaurantCovers: { key: "restaurantCovers", header: "Covers", width: 15 },

    // Bank
    bankName: { key: "bankName", header: "Bank", width: 25 },
    accountNumber: { key: "accountNumber", header: "Account No.", width: 25 },

    // Contacts
    contactPersons: { key: "contactPersons", header: "Contact Persons", width: 40 },

    // Dates
    createdAt: { key: "createdAt", header: "Created", width: 15 },
    updatedAt: { key: "updatedAt", header: "Updated", width: 15 },
  };

  return fields.length === 0
    ? Object.values(fieldMapping)
    : fields
      .map((field) => fieldMapping[field as keyof typeof fieldMapping])
      .filter(Boolean);
};

export const downloadVendorTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Vendor Template", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Define basic vendor columns
    worksheet.columns = [
      { header: "Company Name*", key: "companyName", width: 30 },
      { header: "Display Name", key: "displayName", width: 25 },
      { header: "Contact Person", key: "contactName", width: 25 },
      { header: "Email*", key: "email", width: 30 },
      { header: "Phone*", key: "phone", width: 20 },
      { header: "GST Number", key: "gst", width: 20 },
      { header: "PAN Number", key: "pan", width: 20 },
      { header: "Vendor Type*", key: "vendorType", width: 20 },
      { header: "Category*", key: "category", width: 20 },
      { header: "Address", key: "address", width: 40 },
      { header: "City", key: "city", width: 20 },
      { header: "State", key: "state", width: 20 },
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
    ['H2', 'I2'].forEach(cell => {
      worksheet.getCell(cell).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [
          cell === 'H2'
            ? '"Hotel,Restaurant,Transport,Event,Other"'
            : '"Accommodation,Food,Catering,Logistics,Entertainment"'
        ],
      };
    });

    // Add sample data
    worksheet.addRow({
      companyName: "Grand Hotels Ltd",
      email: "contact@grandhotels.com",
      phone: "9876543210",
      vendorType: "Hotel",
      category: "Accommodation",
      city: "Mumbai",
      state: "Maharashtra"
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
      { field: "Company Name", description: "Legal name of vendor company", required: "Yes" },
      { field: "Display Name", description: "Name to show in system", required: "No" },
      { field: "Contact Person", description: "Primary contact name", required: "No" },
      { field: "Email", description: "Primary contact email", required: "Yes" },
      { field: "Phone", description: "Primary contact phone", required: "Yes" },
      { field: "GST Number", description: "15-character GSTIN", required: "No" },
      { field: "PAN Number", description: "10-character PAN", required: "No" },
      { field: "Vendor Type", description: "Type of vendor business", required: "Yes" },
      { field: "Category", description: "Service category", required: "Yes" },
      { field: "Address", description: "Street address", required: "No" },
      { field: "City", description: "City location", required: "No" },
      { field: "State", description: "State location", required: "No" },
    ];

    instructions.forEach(inst => instructionSheet.addRow(inst));

    // Generate file
    const filename = `vendor_import_template_${Date.now()}.xlsx`;
    const filePath = path.join("public", "uploads", filename);

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await workbook.xlsx.writeFile(filePath);

    res.json({
      status: "success",
      message: "Vendor template downloaded",
      filename,
    });
  } catch (error) {
    console.error("Vendor template generation failed:", error);
    next(error);
  }
};