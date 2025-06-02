import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { ConfirmedQuotesFromVendor } from "@models/confirmedQuotesFromVendor.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { deleteFileUsingUrl } from "@helpers/fileSystem";
import { SalesContact } from "@models/salesContact.model";
import { QuotesFromVendors } from "@models/quotesFromVendors.model";

import axios from "axios";
import { QuotesToCustomer } from "@models/quotesToCustomer.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
axios

export const addConfirmedQuotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // let existsCheck = await ConfirmedQuotes.findOne({ name: req.body.firstName, lastName: req.body.lastName, email: req.body.email }).exec();
    // if (existsCheck) {
    //   throw new Error("ConfirmedQuotes with same email first name, last name and Email already exists");
    // }
    // console.log(req.body.ConfirmedQuotes, "req.body");

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
    await new ConfirmedQuotesFromVendor(req.body).save();
    res.status(201).json({ message: "ConfirmedQuotes Created" });
  } catch (error) {
    next(error);
  }
};




export const getAllConfirmedQuotes = async (req: any, res: any, next: any) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};


    if (req.query.query && req.query.query !== "") {
      matchObj["location.state"] = new RegExp(req.query.query, "i");
      
    }

    pipeline.push({
      $match: matchObj,
    });
    let confirmedQuotesArr = await paginateAggregate(ConfirmedQuotesFromVendor, pipeline, req.query);

    res.status(201).json({
      message: "found all Device",
      data: confirmedQuotesArr.data,
      total: confirmedQuotesArr.total,
    });
  } catch (error) {
    next(error);
  }
};

export const getConfirmedQuotesById = async (
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
    let existsCheck = await ConfirmedQuotesFromVendor.aggregate(pipeline);
    if (!existsCheck || existsCheck.length == 0) {
      throw new Error("ConfirmedQuotes does not exists");
    }
    existsCheck = existsCheck[0];
    res.status(201).json({
      message: "found specific ConfirmedQuotes",
      data: existsCheck,
    });
  } catch (error) {
    next(error);
  }
};

export const updateConfirmedQuotesById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    let existsCheck = await ConfirmedQuotesFromVendor.findById(req.params.id).lean().exec();
    if (!existsCheck) {
      throw new Error("ConfirmedQuotes does not exists");
    }


    let Obj = await ConfirmedQuotesFromVendor.findByIdAndUpdate(req.params.id, req.body).exec();
    res.status(201).json({ message: "ConfirmedQuotes Updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteConfirmedQuotesById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await ConfirmedQuotesFromVendor.findById(req.params.id).exec();
    if (!existsCheck) {
      throw new Error("ConfirmedQuotes does not exists or already deleted");
    }
    // await deleteFileUsingUrl(`uploads/${existsCheck.otherDetails.documents}`);
    await ConfirmedQuotesFromVendor.findByIdAndDelete(req.params.id).exec();
    res.status(201).json({ message: "ConfirmedQuotes Deleted" });
  } catch (error) {
    next(error);
  }
};

// export const convertConfirmedQuotesToSalesContact = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const confirmedQuotesId = req.params.id;

//     const confirmedQuotes = await ConfirmedQuotes.findById(confirmedQuotesId).lean().exec();
//     if (!ConfirmedQuotes) {
//       throw new Error("ConfirmedQuotes does not exist");
//     }

//     const salesContactData = {
//       salutation: ConfirmedQuotes.ConfirmedQuotes.salutation || "",
//       firstName: ConfirmedQuotes.ConfirmedQuotes.firstName || "",
//       lastName: ConfirmedQuotes.ConfirmedQuotes.lastName || "",
//       email: ConfirmedQuotes.ConfirmedQuotes.email || "",
//       phone: ConfirmedQuotes.ConfirmedQuotes.phoneNumber || "",
//       company: ConfirmedQuotes.ConfirmedQuotes.companyName || "",
//       confirmedQuotesId: ConfirmedQuotes._id,
//       state: ConfirmedQuotes.location.state || "",
//       city: ConfirmedQuotes.location.city || "",
//       area: ConfirmedQuotes.location.area || "",
//       phoneNumber: ConfirmedQuotes.ConfirmedQuotes.phoneNumber || "",
//     };

//     const newSalesContact = await new SalesContact(salesContactData).save();

//     res.status(201).json({
//       message: "ConfirmedQuotes successfully converted to Sales Contact",
//       data: newSalesContact,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getAllConfirmedQuotesName = async (req: any, res: any, next: any) => {
//   try {
//     let confirmedQuotes = await ConfirmedQuotes.find(
//       {},
//       "ConfirmedQuotes.firstName ConfirmedQuotes.lastName"
//     ).lean();

//     let ConfirmedQuotesNames = ConfirmedQuotess.map((v: any) => ({
//       fullName: `${v.ConfirmedQuotes.firstName} ${v.ConfirmedQuotes.lastName}`.trim(),
//     }));

//     res.status(200).json({
//       message: "Found all ConfirmedQuotes names",
//       data: ConfirmedQuotesNames,
//       total: ConfirmedQuotesNames.length,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getAllQuoteId = async (req: any, res: any, next: any) => {


  try {
    
    
    let QuoteIds = await QuotesFromVendors.find({},{ quotesId: 1, _id: 0 })

  
    

    res.status(201).json({
      message: "found all Device",
      data: QuoteIds
      
    });
  } catch (error) {
    next(error);
  }
};


export const getConfirmedQuotesByQuoteId
= async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};
    if (req.params.quoteId) {
  
      matchObj.quotesId = req.params.quoteId;
    }
    pipeline.push({
      $match: matchObj,
    });
    let existsCheck = await QuotesFromVendors.aggregate(pipeline);

    if (!existsCheck || existsCheck.length == 0) {
      throw new Error("ConfirmedQuotes does not exists");
    }
    existsCheck = existsCheck[0];
    res.status(201).json({
      message: "found specific ConfirmedQuotes",
      data: existsCheck,
    });
  } catch (error) {
    next(error);
  }
};



export const convertConfirmedQuotesFromVendorToQuotesToCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const confirmedQuotesId = req.params.id;

        const confirmedQuotesFromVendor = await ConfirmedQuotesFromVendor.findById(confirmedQuotesId).lean().exec();
        if (!confirmedQuotesFromVendor) {
            throw new Error("Quote from Vendor does not exist");
        }

        // Check if a quote already exists for this RFP
        const existingQuote = await QuotesToCustomer.findOne({ leadId: confirmedQuotesFromVendor.leadId }).lean().exec();
        if (existingQuote) {
            throw new Error("Quote from Vendors for this RFP already exists.");
        }

        const quotesToCustomerData = {
            ...confirmedQuotesFromVendor,
            status: "Quote sent to customer",
        };

        const newQuotesToCustomer = await new QuotesToCustomer(quotesToCustomerData).save();

        const result = await Enquiry.findOneAndUpdate(
            { leadId: confirmedQuotesFromVendor.leadId },
            { $set: { status: "Quote sent to customer" } }
        ).exec();

       

        await Rfp.updateOne(
            { leadId: confirmedQuotesFromVendor.leadId },
            { $set: { status: "Quote sent to customer", updatedAt: new Date() } }
        );

        await QuotesFromVendors.updateOne(
            { leadId: confirmedQuotesFromVendor.leadId },
            { $set: { status: "Quote sent to customer", updatedAt: new Date() } }
        );

        res.status(201).json({
            message: "Quote from Vendor successfully converted to Quote to Customer",
            data: newQuotesToCustomer,
        });
    } catch (error) {
        next(error);
    }
};
