import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Lead } from "@models/lead.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import XLSX from "xlsx";
import path from 'path'
import ExcelJs from "exceljs";





export const addLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Lead.findOne({ name: req.body.phone }).exec();
        // if (existsCheck) {
        //     throw new Error("Lead with same email already exists");
        // }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     console.log("first", req.body.imagesArr)
        //     for (const el of req.body.imagesArr) {
        //         if (el.image && el.image !== "") {
        //             el.image = await storeFileAndReturnNameBase64(el.image);
        //         }
        //     }
        // }

        console.log(
            "check 2 ", "for check lead"
        )
        const lead = await new Lead(req.body).save();
        res.status(201).json({ message: "Lead Created" });


    } catch (error) {
        next(error);
    }
};

export const getAllLead = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push(
            {
                $match: matchObj,
            }
        );
        if (req?.query?.isForSelectInput) {
            pipeline.push({
                $project: {
                    label:{ $concat: [ "$firstName", " ", "$lastName" ] } ,
                    value: "$_id"
                },
            })
        }
        let LeadArr = await paginateAggregate(Lead, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: LeadArr.data, total: LeadArr.total });
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
            throw new Error("Banquet does not exists");
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


// export const convertToContact = async (req: Request, res: Response, next: NextFunction) => {
//     // try {
//     //     let existsCheck = await SalesContact.findOne({ firstName: req.body.first,  lastName: req.body.last, companyName: req.body.company }).exec();
//     //     if (existsCheck) {
//     //         throw new Error("Contact with same name already exists");
//     //     }

//     console.log(req.params.id,

//         "check params id lead"

//     )

//     try {
//         const lead = await Lead.findById(req.params.id).exec();
//         if (!lead) {
//             throw new Error("Lead not found");
//         }

//         // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
//         //     console.log("first", req.body.imagesArr)
//         //     for (const el of req.body.imagesArr) {
//         //         if (el.image && el.image !== "") {
//         //             el.image = await storeFileAndReturnNameBase64(el.image);
//         //         }
//         //     }
//         // }



//         const existingContact = await SalesContact.findOne({ leadId: req.params.id }).exec();
//         if (existingContact) {
//             throw new Error("A contact already exists for this lead.");
//         }



//         if (lead) {


//             const salesContact = new SalesContact({
//                 firstName: lead.firstName,
//                 lastName: lead.lastName,
//                 phone: lead.phone,
//                 email: lead.email,
//                 company: lead.company,
//                 salutation: lead.salutation,
//                 leadId: lead._id,

//             });

//             await salesContact.save();

//             res.status(200).json({ message: "Contact conversion completed successfully", data: salesContact });
//         }






//         res.status(500).json({ message: "Something Went Wrong", });



//     } catch (error) {
//         next(error);
//     };
// }

export const BulkUploadLead: RequestHandler = async (req, res, next) => {


    console.log("Uploading File", req.body.file);
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

        if (xlData && xlData.length > 0) {
            xlData.map(async (el: any) => await new Lead(el).save())
        }
        res.status(200).json({ message: "File Uploaded Successfully" });
        console.log(xlData, "check xlData")
    } catch (error) {
        next(error);
    }
}


export const downloadExcelLead = async (req: Request, res: Response, next: NextFunction) => {
    try {


        // Create a new workbook and a new sheet
        const workbook = new ExcelJs.Workbook();
        const worksheet = workbook.addWorksheet("Bulk  Lead", {
            pageSetup: { paperSize: 9, orientation: "landscape" },
        });

        worksheet.columns = [
            // Basic Details
            { header: "ID", key: "_id", width: 20 },
            { header: "First Name", key: "firstName", width: 20 },
            { header: "Last Name", key: "lastName", width: 15 },
            { header: "Mobile Phone", key: "phone", width: 20 },
            { header: "Company Name", key: "company", width: 20 },
            { header: "Email", key: "email", width: 20 },
            // { header: "Check-In", key: "checkIn", width: 20 },
            // { header: "Check-Out", key: "checkOut", width: 20 },
            // { header: "Number of Rooms", key: "noOfRooms", width: 20 },
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

        let Leads = await Lead.find({}).lean().exec();

        Leads.forEach((Lead) => {
            console.log(Lead, "check lead")
            worksheet.addRow({
                _id: Lead._id,
                firstName: Lead.firstName,
                lastName: Lead.lastName,
                phone: Lead.phone,
                email: Lead.email,
                company: Lead.company,
                // enquiryType: Lead.enquiryType,
                // location: Enquiry.city,
                // levelOfEnquiry: Enquiry.levelOfEnquiry,
                // checkIn: Enquiry.checkIn,
                // checkOut: Enquiry.checkOut,
                // noOfRooms: Enquiry.noOfRooms,



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


        let filename = `${new Date().getTime()}.xlsx`
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
        console.log(error, "ERROR")
        next(error);
    }

};