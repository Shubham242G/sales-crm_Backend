import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import ExcelJs from "exceljs";
import XLSX from "xlsx";
import path from 'path'

import { Rpf } from "@models/rpf.model"


// serviceType: '',
// eventDate: '',
// eventDetails: '',
// deadlineOfProposal: '',
// vendorList: '',
// additionalInstructions: '',


export const addRpf = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     console.log("first", req.body.imagesArr)
        //     for (const el of req.body.imagesArr) {
        //         if (el.image && el.image !== "") {
        //             el.image = await storeFileAndReturnNameBase64(el.image);
        //         }
        //     }
        // }
        const rpf = await new Rpf(req.body).save();
        res.status(201).json({ message: "Rpf Created" });






    } catch (error) {
        next(error);
    }
};

export const getAllRpf = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let RpfArr = await paginateAggregate(Rpf, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: RpfArr.data, total: RpfArr.total });
    } catch (error) {
        next(error);
    }
};

export const getRpfById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Rpf.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Banquet does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Rpf",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateRpfById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Rpf.findById(req.params.id).lean().exec();
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
        let Obj = await Rpf.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Enquiry Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteRpfById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Rpf.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Enquiry does not exists or already deleted");
        }
        await Rpf.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Enquiry Deleted" });
    } catch (error) {
        next(error);
    }
};


export const BulkUploadRpf: RequestHandler = async (req, res, next) => {
    try {
        let xlsxFile: any = req.file?.path;
        if (!xlsxFile) throw new Error("File Not Found");

        // Read the Excel file
        let workbook = XLSX.readFile(xlsxFile);
        let sheet_nameList = workbook.SheetNames;

        let xlData: any = [];
        sheet_nameList.forEach((element: any) => {
            console.log(element, "check element")
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[element]));
        });

        console.log(xlData, "check xlData")

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


        console.log(finalArr, "check finalArr")
        if (finalArr.length > 0) {
            await Rpf.insertMany(finalArr);

        }

        // Responding back with success
        res.status(200).json({ message: "Bulk upload Enquiry completed successfully", data: finalArr });
    } catch (error) {
        next(error);
    }
};

// export const downloadExcelRpf = async (req: Request, res: Response, next: NextFunction) => {
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



// export const convertRpf = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
//         // if (existsCheck) {
//         //     throw new Error("Banquet with same name already exists");
//         // }

//         // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
//         //     console.log("first", req.body.imagesArr)
//         //     for (const el of req.body.imagesArr) {
//         //         if (el.image && el.image !== "") {
//         //             el.image = await storeFileAndReturnNameBase64(el.image);
//         //         }
//         //     }
//         // }
//         if (req.params.id) {

//             const enquiry = await Enquiry.findOne({ _id: req.params.id })
//             if (enquiry) {


//                 const rpf = new Rpf({
//                     name: enquiry.name,
//                     phone: enquiry.phone,
//                     email: enquiry.email,
//                     typeOfContact: enquiry.typeOfContact,
//                     contactId: enquiry._id,
//                     subject: 'New Enquiry',
//                     details: 'Initial enquiry created automatically.',
//                     priority: 'Normal',
//                 });

//                 await rpf.save();

//                 res.status(200).json({ message: "RPF conversion completed successfully", data: rpf });

//             }


//         }

//         res.status(500).json({ message: "Something Went Wrong", });



//     } catch (error) {
//         next(error);
//     }
// };

