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
import { zohoRequest } from "@util/zoho";
import { IVendor } from "@models/vendor.model";


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

  export const generateVendorPDF = (vendor: IVendor): string => {
    const fileName = `Vendor_${vendor.vendor.displayName}.pdf`;
    const filePath = path.join(__dirname, '../../public/upload', fileName);
  
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));
  
    doc.fontSize(20).text('VENDOR PURCHASE BILL', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Vendor Name: ${vendor.vendor.firstName} ${vendor.vendor.lastName}`);
    doc.text(`Email: ${vendor.vendor.email}`);
    doc.text(`Company Name: ${vendor.vendor.companyName}`);
    doc.text(`Phone Number: ${vendor.vendor.phoneNumber}`);
    doc.text(`GST IN: ${vendor.vendor.gst} `);
    doc.text(`Location: ${vendor.location.state} `);
    doc.end();
  
    return `/vendorsById/${fileName}`; // Public URL for frontend use
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
