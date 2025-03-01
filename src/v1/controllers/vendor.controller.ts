import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { Vendor } from "@models/vendor.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { deleteFileUsingUrl } from "@helpers/fileSystem";
import { SalesContact } from "@models/salesContact.model";

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
      console.log(req?.body?.otherDetails?.documents, "for loop is working 2")
      for (let i = 0; i < req.body.otherDetails.documents.length; i++) {
        console.log("for loop is working")
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

export const getAllVendor = async (req: any, res: any, next: any) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};

    console.log("Incoming query:", req.query);

    if (req.query.query && req.query.query !== "") {
      matchObj["location.state"] = new RegExp(req.query.query, "i");
      console.log(
        "Search filter applied for location.state:",
        matchObj["location.state"]
      );
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
  console.log(req.body, "req.body full");
  try {
    let existsCheck = await Vendor.findById(req.params.id).lean().exec();
    if (!existsCheck) {
      throw new Error("Vendor does not exists");
    }

    console.log(req.body.rooms, "check room ");

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

    console.log(req.body.banquets, "check banquets");

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

    console.log( req.body.restaurant.restaurantImageUpload,"checking the restaurant");

    if (req?.body?.restaurant && req?.body?.restaurant?.restaurantImageUpload?.length > 0) {

      console.log(req?.body?.restaurant?.restaurantImageUpload, "for loop is working 2")
      for (
        let i = 0;
        i < req?.body?.restaurant?.restaurantImageUpload?.length;
        i++
      ) {

        console.log("for loop is working")
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

    console.log(req.body, "req.body full");
    if (req?.body?.otherDetails?.documents && req.body.otherDetails.documents.length > 0) {
      console.log(req?.body?.otherDetails?.documents, "for loop is working 2")
      for (let i = 0; i < req.body.otherDetails.documents.length; i++) {
        console.log("for loop is working")
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

export const getAllVendorName = async (req: any, res: any, next: any) => {
  try {
    let vendors = await Vendor.find(
      {},
      "vendor.firstName vendor.lastName"
    ).lean();

    let vendorNames = vendors.map((v: any) => ({
      fullName: `${v.vendor.firstName} ${v.vendor.lastName}`.trim(),
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
