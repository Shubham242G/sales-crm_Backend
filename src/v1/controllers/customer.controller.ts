

import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Customer } from "@models/customer.model";
import  xlsx  from "xlsx";
import multer from "multer";




export const addCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }
        // if (req?.body?.documentArray && req?.body?.documentArray?.length > 0 && req?.body?.documentArray?.includes("base64"))  {
            
        //     for (let el of req?.body?.documentArray) {
        //         if (el && el !== "") {
        //             console.log(el, "before conversion");
        //             el = await storeFileAndReturnNameBase64(el);
              
        //         }
               
        //     }
        // }

        if (req?.body?.documentArray?.length > 0) {
            req.body.documentArray = await Promise.all(
              req.body.documentArray.map(async (el: any) => {
                if (el && el.includes("base64")) {
                  return await storeFileAndReturnNameBase64(el);
                }
                return el; // Return the same value if no update is needed
              })
            );
          }

   
        const customer = await new Customer(req.body).save();
        res.status(201).json({ message: "Customer Created" });


    } catch (error) {
        next(error);
    }
};

export const getAllCustomer = async (req: any, res: any, next: any) => {

    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let CustomerArr = await paginateAggregate(Customer, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: CustomerArr.data, total: CustomerArr.total });
    } catch (error) {
        next(error);
    }
};

export const CustomerBulkUpload: RequestHandler = async (req, res, next) => {
    console.log("Working customer bulk upload");
    try {
      const file = req.file?.path;
      if (!file) throw new Error("File not uploaded");
  
      console.log("File path:", file); // Debug file path
      const workbook = xlsx.readFile(file);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
      const success = [];
      const errors = [];
      const customersToInsert: any[] = [];
  
      // Step 1: Validate and prepare data
      for (const [i, row] of sheetData.entries()) {
        try {
          const typedRow = row as Record<string, any>;
          if (!typedRow["Company Name"] || !typedRow["EmailID"]) {
            errors.push({ row: i + 2, error: "Missing Company Name or EmailID" });
            continue;
          }
  
          const customerData = {
            customerType: typedRow["Customer Type"] || "Business", // Default from schema
            salutation: typedRow["Salutation"] || "",
            firstName: typedRow["First Name"] || "",
            lastName: typedRow["Last Name"] || "",
            companyName: typedRow["Company Name"],
            displayName: typedRow["Display Name"] || typedRow["Company Name"],
            email: typedRow["EmailID"],
            workPhone: typedRow["Phone"] || "",
            mobile: typedRow["MobilePhone"] || "",
            panNumber: typedRow["MSME/Udyam No"] || typedRow["PAN"] || "",
            placeOfSupply: typedRow["Source of Supply"] || "", // Mapping from vendor file
            prefersEmail: typedRow["Prefers Email"]?.toLowerCase() === "yes" || false,
            prefersSms: typedRow["Prefers SMS"]?.toLowerCase() === "yes" || false,
            gstTreatment: typedRow["GST Treatment"] || "",
            taxPreference: typedRow["Tax Preference"] || "Taxable", // Default from schema
            currency: typedRow["Currency Code"] || "",
            paymentTerms: typedRow["Payment Terms Label"] || "",
            priceList: typedRow["Price List"] || "",
            enablePortal: typedRow["Enable Portal"]?.toLowerCase() === "yes" || false,
            portalLanguage: typedRow["Portal Language"] || "",
            openingBalanceState: typedRow["Opening Balance State"] || "",
            openingBalance: typedRow["Opening Balance"] || "",
            creditLimit: typedRow["Credit Limit"] || "",
            countryRegion: typedRow["Billing Country"] || "",
            addressStreet1: typedRow["Billing Address"] || "",
            addressStreet2: typedRow["Billing Street2"] || "",
            city: typedRow["Billing City"] || "",
            state: typedRow["Billing State"] || "",
            phoneNumber: typedRow["Billing Phone"] || "",
            pinCode: typedRow["Billing Code"] || "",
            faxNumber: typedRow["Billing Fax"] || "",
            shippingCountryRegion: typedRow["Shipping Country"] || "",
            shippingAddressStreet1: typedRow["Shipping Address"] || "",
            shippingAddressStreet2: typedRow["Shipping Street2"] || "",
            shippingCity: typedRow["Shipping City"] || "",
            shippingState: typedRow["Shipping State"] || "",
            shippingPhoneNumber: typedRow["Shipping Phone"] || "",
            shippingPinCode: typedRow["Shipping Code"] || "",
            shippingFaxNumber: typedRow["Shipping Fax"] || "",
            contactPersons: [
              {
                salutation: typedRow["Salutation"] || "",
                firstName: typedRow["First Name"] || "",
                lastName: typedRow["Last Name"] || "",
                email: typedRow["EmailID"] || "",
                workPhone: typedRow["Phone"] || "",
                mobilePhone: typedRow["MobilePhone"] || "",
                communicationChannels: {
                  prefersEmail: typedRow["Prefers Email"]?.toLowerCase() === "yes" || false,
                  prefersSms: typedRow["Prefers SMS"]?.toLowerCase() === "yes" || false,
                },
              },
            ],
            documentArray: [], // Not in file, default to empty array
            websiteUrl: typedRow["Website"] || "",
            department: typedRow["Department"] || "",
            designation: typedRow["Designation"] || "",
            twitter: typedRow["Twitter"] || "",
            skype: typedRow["Skype Identity"] || "",
            facebook: typedRow["Facebook"] || "",
          };
  
          // Clean up multi-line addresses
          if (customerData.addressStreet1) {
            customerData.addressStreet1 = customerData.addressStreet1.replace(/\n/g, " ").trim();
          }
          if (customerData.shippingAddressStreet1) {
            customerData.shippingAddressStreet1 = customerData.shippingAddressStreet1.replace(/\n/g, " ").trim();
          }
  
          // Check for duplicates within the Excel file
          const isDuplicateInExcel = customersToInsert.some(
            (c) =>
              c.email === customerData.email ||
              c.companyName === customerData.companyName
          );
          if (isDuplicateInExcel) {
            errors.push({
              row: i + 2,
              error: "Duplicate customer (email or company name) in Excel file",
            });
            continue;
          }
  
          // Check for duplicates in the database
          const existing = await Customer.findOne({
            $or: [
              { email: customerData.email },
              { companyName: customerData.companyName },
            ],
          });
  
          if (existing) {
            errors.push({
              row: i + 2,
              error: "Duplicate customer (email or company name) in database",
            });
            continue;
          }
  
          customersToInsert.push(customerData);
          success.push({ row: i + 2, message: "Customer queued for insertion" });
        } catch (err: any) {
          console.error(`Error processing row ${i + 2}:`, err);
          errors.push({ row: i + 2, error: err.message || "Unknown error" });
        }
      }
  
      // Step 2: Insert all valid customers at once
      if (customersToInsert.length > 0) {
        try {
          await Customer.insertMany(customersToInsert, { ordered: false });
          console.log(`Inserted ${customersToInsert.length} customers`);
        } catch (insertErr: any) {
          console.error("Bulk insert error:", insertErr);
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
        message: "Customer bulk import complete",
        successCount: validSuccess.length,
        errorCount: errors.length,
        errors,
      });
    } catch (err: any) {
      console.error("CustomerBulkUpload error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  };

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Customer.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Customer does not exists");
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

export const updateCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {

        let existsCheck = await Customer.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Customer does not exists");
        }



        // if (req?.body?.documentArray && req?.body?.documentArray?.length > 0 ) {

        //     console.log(req.body.documentArray, "check the document array inside include statement ")
        //     for (let el of req.body.documentArray) {
        //         if (el && el !== "" && el.includes("base64")) {
        //             console.log("el check for store", el)
        //             el = await storeFileAndReturnNameBase64(el);
        //             console.log("el check after store", el)
        //         }
        //     }
        // }

        if (req?.body?.documentArray?.length > 0) {
            req.body.documentArray = await Promise.all(
              req.body.documentArray.map(async (el: any) => {
                if (el && el.includes("base64")) {
                  return await storeFileAndReturnNameBase64(el);
                }
                return el; // Return the same value if no update is needed
              })
            );
          }


        let Obj = await Customer.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Customer Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Customer.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Lead does not exists or already deleted");
        }
        await Customer.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Lead Deleted" });
    } catch (error) {
        next(error);
    }
};







