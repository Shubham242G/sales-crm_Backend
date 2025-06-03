import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { DepartmentMaster } from "@models/departmentMaster.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { deleteFileUsingUrl  }from "@helpers/fileSystem";
import ExcelJs from "exceljs";
import path from "path";
import fs from "fs";
import {ExportService} from "../../util/excelfile";
export const addDepartmentMaster = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

 
  try {
    let existsCheck = await DepartmentMaster.findOne({ department: req.body.department , subDepartment: req.body.subDepartment }).exec();
  
    if (existsCheck) {
      throw new Error("Department with same subDepartment");
    }
    // console.log(req.body.vendor, "req.body");
    // if (req?.body?.documents && req?.body?.documents && req?.body?.documents != "" && String(req?.body?.documents).includes("base64")) {
    //   req.body.documents = await storeFileAndReturnNameBase64(req.body.documents);
    // }
    await new DepartmentMaster(req.body).save();
    res.status(201).json({ message: "Department Master Created" });
  } catch (error) {
    next(error);
  }
};

export const getAllDepartmentMaster = async (req: any, res: any, next: any) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};
    if (req.query.query && req.query.query != "") {
      matchObj.name = new RegExp(req.query.query, "i");
    }
    if (req.query.isForSelectInput) {
      pipeline.push({
        $project: {
          label: "$department",
          value: "$_id",
        },
      });
    }
    pipeline.push({
      $match: matchObj,
    });
    let DepartmentArr = await paginateAggregate(DepartmentMaster, pipeline, req.query);
    res.status(201).json({
      message: "found all Device",
      data: DepartmentArr.data,
      total: DepartmentArr.total,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentMasterById = async (
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
    let existsCheck = await DepartmentMaster.aggregate(pipeline);
    if (!existsCheck || existsCheck.length == 0) {
      throw new Error("DepartmentMaster does not exists");
    }
    existsCheck = existsCheck[0];
    res.status(201).json({
      message: "found specific DEPARTMENT",
      data: existsCheck,
    });
  } catch (error) {
    next(error);
  }
};


export const updateDepartmentMasterById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await DepartmentMaster.findById(req.params.id).lean().exec();
    if (!existsCheck) {
      throw new Error("DepartmentMaster does not exists");

    }

    
    let Obj = await DepartmentMaster.findByIdAndUpdate(req.params.id, req.body).exec();
    res.status(201).json({ message: "DepartmentMaster Updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartmentMasterById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await DepartmentMaster.findById(req.params.id).exec();
    if (!existsCheck) {
      throw new Error("DepartmentMaster does not exists or already deleted");
    }
    
    await DepartmentMaster.findByIdAndDelete(req.params.id).exec();
    res.status(201).json({ message: "DepartmentMaster Deleted" });
  } catch (error) {
    next(error);
  }
};

