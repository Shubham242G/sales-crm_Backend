import { paginateAggregate } from "@helpers/paginateAggregate";
import { RawMaterialCategories } from "@models/rawMaterialCategories.model";
import { addLogs } from "@helpers/addLog";
import mongoose from "mongoose";
import { PurchaseOrder } from "@models/purchaseOrder.model";
import { GENERALSTATUS } from "@common/constant.common";
import { IMOC, MOC } from "@models/moc.model";
import { NextFunction } from "express";
import XLSX from "xlsx";


export const addMOC = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    let existsCheck = await MOC.findOne({
      name: new RegExp(`^${req.body.name}$`, "i"),
    }).exec();
    if (existsCheck) {
      throw new Error("MOQ already exists");
    }
    await new MOC(req.body).save();
    addLogs("MOQ  added", req.body.name, req.body.name);
    res.status(201).json({ message: "MOQ Created" });
  } catch (error) {
    next(error);
  }
};






export const getAllMoc = async (req: any, res: any, next: any) => {
  try {
    let pipeline: any = [];
    let matchObj: any = {};
    if (req.query.query && req.query.query != "") {
      matchObj.$or = [
        { name: new RegExp(req.query.query, "i") },
      ];
    }

    pipeline.push({
      $match: matchObj,
    });

    let MOCArr = await paginateAggregate(MOC, pipeline, req.query);

    res.status(201).json({
      message: "found all MOQ",
      data: MOCArr,
    });
  } catch (error) {
    next(error);
  }
};


export const getMocById = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    const { id } = req.params;
    let pipeline = [
      {
        '$match': {
          '_id': new mongoose.Types.ObjectId(id)
        }
      }, {
        '$unwind': {
          'path': '$rawMaterialsArr',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$lookup': {
          'from': 'rawmatterials',
          'localField': 'rawMaterialsArr.rawMaterialId',
          'foreignField': '_id',
          'as': 'rawMaterialObj'
        }
      }, {
        '$unwind': {
          'path': '$rawMaterialObj',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$addFields': {
          'rawMaterialsArr.label': '$rawMaterialObj.name',
          'rawMaterialsArr.value': '$rawMaterialObj._id'
        }
      }, {
        '$group': {
          '_id': '$_id',
          'name': {
            '$first': '$name'
          },
          'retailerid': {
            '$first': '$retailerid'
          },
          'rawMaterialsArr': {
            '$addToSet': '$rawMaterialsArr'
          }
        }
      }
    ]
    let MocObj: IMOC[] | IMOC = await MOC.aggregate(pipeline);
    if (!MocObj || (MocObj.length == 0)) {
      throw new Error("Minimum order quantity not found !!!");
    }
    MocObj = MocObj[0]
    res.json({
      success: true,
      data: MocObj,
      message: "MoQ data",
    });
  } catch (error) {
    next(error);
  }
};




export const updateMOCById = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    let existsCheck = await MOC.findById(req.params.id)
      .lean()
      .exec();
    if (!existsCheck) {
      throw new Error("MOq does not exists");
    }

    addLogs("MOQ updated", req.body.name, req.body.name);
    let grnObj =
      await MOC.findByIdAndUpdate(
        req.params.id,
        req.body
      ).exec();
    res.status(201).json({ message: "MOQ Updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteMOCById = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    let existsCheck = await MOC.findById(
      req.params.id
    ).exec();
    if (!existsCheck) {
      throw new Error("MOQ does not exists");
    }
    let MOCObj =
      await MOC.findByIdAndDelete(req.params.id).exec();
    addLogs(" removed", req.body.name, req.body.name);
    res.status(201).json({ message: "MOQ Deleted" });
  } catch (error) {
    next(error);
  }
};


export const bulkUpload = async (req: any, res: any, next: any) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetNameList = workbook.SheetNames;
    let xlData: any = [];

    sheetNameList.forEach((sheetName) => {
      xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
    });

    for (let index = 0; index < xlData.length; index++) {
      let obj: any = {};
      const rowData = xlData[index];

      // Initialize obj.rawMaterialsArr if it doesn't exist
      obj.rawMaterialsArr = obj.rawMaterialsArr || {};

      if (rowData["MINIMUM STOCK"]) {
        obj.rawMaterialsArr.quantity = rowData["MINIMUM STOCK"];
      }
      if (rowData["Display Name"]) {
        obj.rawMaterialsArr.productName = rowData["Display Name"];
      }
      if (rowData["Name"]) {
        obj.name = rowData["Name"];
      }

      // const existingProduct = await MOC.findOne({ safeCoCode: obj.safeCoCode }).exec();
      // if (existingProduct) {
      // await MOC.findOneAndUpdate({ safeCoCode: existingProduct.retailerid, obj }).exec();
      // } else {
      await new MOC(obj).save();
      // }
    }

    res.status(200).json({ message: "Successfully Uploaded file", success: true });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
