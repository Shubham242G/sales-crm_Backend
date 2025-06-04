import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage, Types } from "mongoose";
import { Category } from "@models/category.model";
import { Vendor } from "@models/vendor.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Hotel } from "@models/hotel.model";
import { Banquet } from "@models/banquet.model";
import path from "path";
import fs from "fs";
import {ExportService} from "../../util/excelfile";
import ExcelJs from "exceljs";
export const addBanquet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }

        if (req.body.imagesArr && req.body.imagesArr.length > 0) {

            for (const el of req.body.imagesArr) {
                if (el.image && el.image !== "") {
                    el.image = await storeFileAndReturnNameBase64(el.image);
                }
            }
        }
        await new Banquet(req.body).save();
        res.status(201).json({ message: "Banquet Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllBanquet = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let BanquetArr = await paginateAggregate(Banquet, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: BanquetArr.data, total: BanquetArr.total });
    } catch (error) {
        next(error);
    }
};

export const getBanquetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Banquet.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Banquet does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Banquet",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateBanquetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Banquet.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Banquet does not exists");
        }

        if (req.body.imagesArr && req.body.imagesArr.length > 0) {
            for (const el of req.body.imagesArr) {
                if (el.images && el.images !== "" && el.images.includes("base64")) {
                    el.images = await storeFileAndReturnNameBase64(el.images);
                }
            }
        }
        let Obj = await Banquet.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Banquet Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteBanquetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Banquet.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Banquet does not exists or already deleted");
        }
        await Banquet.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Banquet Deleted" });
    } catch (error) {
        next(error);
    }
};

export const downloadExcelBanquet = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const isSelectedExport =
      req.body.tickRows &&
      Array.isArray(req.body.tickRows) &&
      req.body.tickRows.length > 0;
  
    return ExportService.downloadFile(req, res, next, {
      model: Banquet,
      buildQuery: buildBanquetQuery,
      formatData: formatBanquetData,
      processFields: processBanquetFields,
      filename: isSelectedExport ? "selected_banquets" : "banquets",
      worksheetName: isSelectedExport ? "Selected Banquets" : "Banquets",
      title: isSelectedExport ? "Selected Banquets" : "Banquets",
    });
  };
  
  // -----------------------
  // Query Builder
  // -----------------------
  
  const buildBanquetQuery = (req: Request) => {
    const query: any = {};
  
    if (req.body.tickRows && Array.isArray(req.body.tickRows) && req.body.tickRows.length > 0) {
      query._id = { $in: req.body.tickRows.map((id: string) => new Types.ObjectId(id)) };
      return query;
    }
  
    if (req.body.size) query.size = req.body.size;
    if (req.body.foodOption) query.foodOption = req.body.foodOption;
  
    if (req.body.dateFrom && req.body.dateTo) {
      query.createdAt = {
        $gte: new Date(req.body.dateFrom),
        $lte: new Date(req.body.dateTo),
      };
    }
  
    if (req.body.search) {
      query.$or = [
        { banquetName: { $regex: req.body.search, $options: "i" } },
        { setup: { $regex: req.body.search, $options: "i" } },
      ];
    }
  
    return query;
  };
  
  // -----------------------
  // Format Banquet Row Data
  // -----------------------
  
  const formatBanquetData = (banquet: any) => {
    return {
      id: banquet._id,
      banquetName: banquet.banquetName,
      size: banquet.size,
      setup: banquet.setup,
      foodOption: banquet.foodOption,
      vegPrice: banquet.vegPrice,
      nonVegPrice: banquet.nonVegPrice,
      PFAsize: banquet.PFAsize,
      imageCount: banquet.imagesArr?.length || 0,
      createdAt: banquet.createdAt,
      updatedAt: banquet.updatedAt
        ? new Date(banquet.updatedAt).toLocaleDateString()
        : "",
    };
  };
  
  // -----------------------
  // Define Excel Fields
  // -----------------------
  
  const processBanquetFields = (fields: string[]) => {
    const fieldMapping = {
      id: { key: "id", header: "ID", width: 15 },
      banquetName: { key: "banquetName", header: "Banquet Name", width: 25 },
      size: { key: "size", header: "Size", width: 15 },
      setup: { key: "setup", header: "Setup", width: 20 },
      foodOption: { key: "foodOption", header: "Food Option", width: 20 },
      vegPrice: { key: "vegPrice", header: "Veg Price", width: 15 },
      nonVegPrice: { key: "nonVegPrice", header: "Non-Veg Price", width: 15 },
      PFAsize: { key: "PFAsize", header: "PFA Size", width: 15 },
      imageCount: { key: "imageCount", header: "No. of Images", width: 18 },
      createdAt: { key: "createdAt", header: "Created At", width: 20 },
      updatedAt: { key: "updatedAt", header: "Updated At", width: 20 },
    };
  
    if (!fields || fields.length === 0) {
      return Object.values(fieldMapping);
    }
  
    return fields
      .map((field: string) => fieldMapping[field as keyof typeof fieldMapping])
      .filter((item) => Boolean(item));
  };
  
  // -----------------------
  // Download Template for Banquet Import
  // -----------------------
  
  export const downloadBanquetTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Banquet Template");
  
      worksheet.columns = [
        { header: "Banquet Name*", key: "banquetName", width: 25 },
        { header: "Size*", key: "size", width: 15 },
        { header: "Setup*", key: "setup", width: 20 },
        { header: "Food Option*", key: "foodOption", width: 20 },
        { header: "Veg Price", key: "vegPrice", width: 15 },
        { header: "Non-Veg Price", key: "nonVegPrice", width: 15 },
        { header: "PFA Size", key: "PFAsize", width: 15 },
      ];
  
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
  
      // Add example data
      worksheet.addRow({
        banquetName: "Royal Hall",
        size: "Large",
        setup: "Theatre",
        foodOption: "Both",
        vegPrice: "500",
        nonVegPrice: "700",
        PFAsize: "150",
      });
  
      // Data validation for dropdowns
      worksheet.getCell("C2").dataValidation = {
        type: "list",
        formulae: ['"Theatre,U-Shape,Classroom,Cluster,Banquet"'],
        allowBlank: false,
      };
  
      worksheet.getCell("D2").dataValidation = {
        type: "list",
        formulae: ['"Veg,Non-Veg,Both"'],
        allowBlank: false,
      };
  
      const instructionSheet = workbook.addWorksheet("Instructions");
      instructionSheet.columns = [
        { header: "Field", key: "field", width: 25 },
        { header: "Description", key: "description", width: 50 },
        { header: "Required", key: "required", width: 10 },
      ];
  
      const instHeaderRow = instructionSheet.getRow(1);
      instHeaderRow.font = { bold: true };
      instHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
  
      const instructions = [
        { field: "Banquet Name", description: "Name of the banquet", required: "Yes" },
        { field: "Size", description: "Size category (Small, Medium, Large)", required: "Yes" },
        { field: "Setup", description: "Seating setup type", required: "Yes" },
        { field: "Food Option", description: "Veg/Non-Veg/Both", required: "Yes" },
        { field: "Veg Price", description: "Price per plate (veg)", required: "No" },
        { field: "Non-Veg Price", description: "Price per plate (non-veg)", required: "No" },
        { field: "PFA Size", description: "Pre-function area size", required: "No" },
      ];
  
      instructions.forEach((inst) => instructionSheet.addRow(inst));
  
      const timestamp = new Date().getTime();
      const filename = `banquet_template_${timestamp}.xlsx`;
      const directory = path.join("public", "uploads");
  
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
  
      const filePath = path.join(directory, filename);
      await workbook.xlsx.writeFile(filePath);
  
      res.json({
        status: "success",
        message: "Banquet template downloaded successfully",
        filename,
      });
    } catch (error) {
      console.error("Banquet template download error:", error);
      next(error);
    }
  };
