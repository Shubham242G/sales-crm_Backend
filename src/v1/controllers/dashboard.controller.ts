import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Dashboard } from "@models/dashboard.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import XLSX from "xlsx";
import path from "path";
import ExcelJs from "exceljs";
import { QuotesToCustomer } from "@models/quotesToCustomer.model";

export const addDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // let existsCheck = await Dashboard.findOne({ name: req.body.phone }).exec();
    // if (existsCheck) {
    //     throw new Error("Dashboard with same email already exists");
    // }

    // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
    //     console.log("first", req.body.imagesArr)
    //     for (const el of req.body.imagesArr) {
    //         if (el.image && el.image !== "") {
    //             el.image = await storeFileAndReturnNameBase64(el.image);
    //         }
    //     }
    // }

    const dashboard = await new Dashboard(req.body).save();
    res.status(201).json({ message: "Dashboard Created" });
  } catch (error) {
    next(error);
  }
};

export const getAllDashboard = async (req: any, res: any, next: any) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};
    if (req.query.query && req.query.query !== "") {
      matchObj.name = new RegExp(req.query.query, "i");
    }
    pipeline.push({
      $match: matchObj,
    });

    const quotesAggregation = await QuotesToCustomer.aggregate([
      {
        $group: {
          _id: null,
          totalCostOfVendors: { $sum: { $toDouble: "$amount" } },
          totalBusinessFromCustomers: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]);

    const costOfVendors = quotesAggregation[0]?.totalCostOfVendors || 0;
    const businessFromCustomers =
      quotesAggregation[0]?.totalBusinessFromCustomers || 0;
    const revenue = businessFromCustomers - costOfVendors;

    
    // Fetch dashboard data
    let dashboardArr = await paginateAggregate(Dashboard, pipeline, req.query);

    // If no dashboard exists, create one with calculated values
    if (dashboardArr.total === 0) {
      const newDashboard = await new Dashboard({
        costOfVendor: costOfVendors.toString(),
        businessFromCustomer: businessFromCustomers.toString(),
        revenue: revenue.toString(),
      }).save();
      dashboardArr.data = [newDashboard];
      dashboardArr.total = 1;
    } else {
      // Update the first dashboard entry with calculated values
      await Dashboard.findOneAndUpdate(
        {},
        {
          costOfVendor: costOfVendors.toString(),
          businessFromCustomer: businessFromCustomers.toString(),
          revenue: revenue.toString(),
        },
        { new: true }
      );
      dashboardArr.data = await Dashboard.find({}).lean().exec();
    }

    res.status(200).json({
      message: "Found all dashboards",
      data: dashboardArr.data,
      total: dashboardArr.total,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardById = async (
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
    let existsCheck = await Dashboard.aggregate(pipeline);
    if (!existsCheck || existsCheck.length == 0) {
      throw new Error("Dashboard does not exists");
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

export const updateDashboardById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await Dashboard.findById(req.params.id).lean().exec();
    if (!existsCheck) {
      throw new Error("Dashboard does not exists");
    }

    // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
    //     for (const el of req.body.imagesArr) {
    //         if (el.images && el.images !== "" && el.images.includes("base64")) {
    //             el.images = await storeFileAndReturnNameBase64(el.images);
    //         }
    //     }
    // }
    let Obj = await Dashboard.findByIdAndUpdate(req.params.id, req.body).exec();
    res.status(201).json({ message: "Dashboard Updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteDashboardById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await Dashboard.findById(req.params.id).exec();
    if (!existsCheck) {
      throw new Error("Dashboard does not exists or already deleted");
    }
    await Dashboard.findByIdAndDelete(req.params.id).exec();
    res.status(201).json({ message: "Dashboard Deleted" });
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

//         "check params id dashboard"

//     )

//     try {
//         const dashboard = await Dashboard.findById(req.params.id).exec();
//         if (!dashboard) {
//             throw new Error("Dashboard not found");
//         }

//         // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
//         //     console.log("first", req.body.imagesArr)
//         //     for (const el of req.body.imagesArr) {
//         //         if (el.image && el.image !== "") {
//         //             el.image = await storeFileAndReturnNameBase64(el.image);
//         //         }
//         //     }
//         // }

//         const existingContact = await SalesContact.findOne({ dashboardId: req.params.id }).exec();
//         if (existingContact) {
//             throw new Error("A contact already exists for this dashboard.");
//         }

//         if (dashboard) {

//             const salesContact = new SalesContact({
//                 firstName: dashboard.firstName,
//                 lastName: dashboard.lastName,
//                 phone: dashboard.phone,
//                 email: dashboard.email,
//                 company: dashboard.company,
//                 salutation: dashboard.salutation,
//                 dashboardId: dashboard._id,

//             });

//             await salesContact.save();

//             res.status(200).json({ message: "Contact conversion completed successfully", data: salesContact });
//         }

//         res.status(500).json({ message: "Something Went Wrong", });

//     } catch (error) {
//         next(error);
//     };
// }

export const BulkUploadDashboard: RequestHandler = async (req, res, next) => {
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
      xlData.map(async (el: any) => await new Dashboard(el).save());
    }
    res.status(200).json({ message: "File Uploaded Successfully" });
  } catch (error) {
    next(error);
  }
};

export const downloadExcelDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Create a new workbook and a new sheet
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Bulk  Dashboard", {
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

    let Dashboards = await Dashboard.find({}).lean().exec();

    Dashboards.forEach((Dashboard) => {
      worksheet.addRow({
        costOfVendor: Dashboard.costOfVendor,
        businessFromCustomer: Dashboard.businessFromCustomer,
        revenue: Dashboard.revenue,
        // email: Dashboard.email,
        // company: Dashboard.company,
        // enquiryType: Dashboard.enquiryType,
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

export const getAllDashboardName = async (req: any, res: any, next: any) => {
  try {
    let dashboards = await Dashboard.find(
      {},
      { firstName: 1, lastName: 1, _id: 0 }
    ).lean();

    let dashboardNames = dashboards.map((v: any) => ({
      fullName: `${v.firstName} ${v.lastName}`.trim(),
    }));

    res.status(200).json({
      message: "Found all dashboards names",
      data: dashboardNames,
      total: dashboardNames.length,
    });
  } catch (error) {
    next(error);
  }
};
