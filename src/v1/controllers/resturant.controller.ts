import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { Category } from "@models/category.model";
import { Vendor } from "@models/vendor.model";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Hotel } from "@models/hotel.model";
import { Banquet } from "@models/banquet.model";
import { Resturant } from "@models/resturant.model";
import { ExportService } from "../../util/excelfile";

import ExcelJs from "exceljs";
import path from "path";
import fs from "fs";

export const addResturant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }

        if(req.body.imagesArr && req.body.imagesArr.length > 0){
            for(const el of req.body.imagesArr){
                if (el.image && el.image !== "") {
                    el.image = await storeFileAndReturnNameBase64(el.image);
                }
            }
          }
        await new Resturant(req.body).save();
        res.status(201).json({ message: "Resturant Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllResturant = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        const { query } = req.query;
    // Handle basic search - search across multiple fields
    if (
      req.query.query &&
      typeof req.query.query === "string" &&
      req.query.query !== ""
    ) {
      matchObj.$or = [
        {
          foodOptions: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          noOfOccupancy: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          floor: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          swimmingPool: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        // Add any other fields you want to search by
      ];
    }

    // Handle advanced search (same as before)
    if (req?.query?.advancedSearch && req.query.advancedSearch !== "") {
      const searchParams =
        typeof req.query.advancedSearch === "string"
          ? req.query.advancedSearch.split(",")
          : [];

      const advancedSearchConditions: any[] = [];

      searchParams.forEach((param: string) => {
        const [field, condition, value] = param.split(":");

        if (field && condition && value) {
          let fieldCondition: Record<string, any> = {};

          switch (condition) {
            case "contains":
              fieldCondition[field] = { $regex: value, $options: "i" };
              break;
            case "equals":
              fieldCondition[field] = value;
              break;
            case "startsWith":
              fieldCondition[field] = { $regex: `^${value}`, $options: "i" };
              break;
            case "endsWith":
              fieldCondition[field] = { $regex: `${value}$`, $options: "i" };
              break;
            case "greaterThan":
              fieldCondition[field] = {
                $gt: isNaN(Number(value)) ? value : Number(value),
              };
              break;
            case "lessThan":
              fieldCondition[field] = {
                $lt: isNaN(Number(value)) ? value : Number(value),
              };
              break;
            default:
              fieldCondition[field] = { $regex: value, $options: "i" };
          }

          advancedSearchConditions.push(fieldCondition);
        }
      });

      // If we have both basic and advanced search, we need to combine them
      if (matchObj.$or) {
        // If there are already $or conditions (from basic search)
        // We need to use $and to combine with advanced search
        matchObj = {
          $and: [{ $or: matchObj.$or }, { $and: advancedSearchConditions }],
        };
      } else {
        // If there's only advanced search, use $and directly
        matchObj.$and = advancedSearchConditions;
      }
    }

    // Add the match stage to the pipeline
    pipeline.push({
      $match: matchObj,
    });
        let ResturantArr = await paginateAggregate(Resturant, pipeline, req.query);
        res.status(201).json({ message: "found all Device", data: ResturantArr.data, total: ResturantArr.total });
    } catch (error) {
        next(error);
    }
};

export const getResturantById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Resturant.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Resturant does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Resturant",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateResturantById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Resturant.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Resturant does not exists");
        }

        if(req.body.imagesArr && req.body.imagesArr.length > 0){
            for(const el of req.body.imagesArr){
                if(el.images && el.images !== "" && el.images.includes("base64")){
                  el.images = await storeFileAndReturnNameBase64(el.images);
                }  
            }
          }
        let Obj = await Resturant.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Resturant Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteResturantById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Resturant.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Resturant does not exists or already deleted");
        }
        await Resturant.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Resturant Deleted" });
    } catch (error) {
        next(error);
    }
};
export const downloadExcelResturant = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // Determine export type and adjust filename/title accordingly
    const isSelectedExport =
      req.body.tickRows &&
      Array.isArray(req.body.tickRows) &&
      req.body.tickRows.length > 0;
  
    return ExportService.downloadFile(req, res, next, {
      model: Resturant,
      buildQuery: buildResturantQuery,
      formatData: formatResturantData,
      processFields: processResturantFields,
      filename: isSelectedExport ? "selected_resturants" : "resturants",
      worksheetName: isSelectedExport ? "Selected Resturants" : "Resturants",
      title: isSelectedExport ? "Selected Resturants" : "Resturants",
    });
  };
  
  const buildResturantQuery = (req: Request) => {
    const query: any = {};
  
    // Check if specific IDs are selected (tickRows)
    if (
      req.body.tickRows &&
      Array.isArray(req.body.tickRows) &&
      req.body.tickRows.length > 0
    ) {
      query._id = { $in: req.body.tickRows };
      return query;
    }
  
    // Apply regular filters if no tickRows
    if (req.body.foodOptions) {
      query.foodOptions = req.body.foodOptions;
    }
  
    if (req.body.dateFrom && req.body.dateTo) {
      query.createdAt = {
        $gte: new Date(req.body.dateFrom),
        $lte: new Date(req.body.dateTo),
      };
    }
  
    // Add search functionality
    if (req.body.search) {
      query.$or = [
        { foodOptions: { $regex: req.body.search, $options: "i" } },
        { noOfOccupancy: { $regex: req.body.search, $options: "i" } },
        { floor: { $regex: req.body.search, $options: "i" } },
        { swimmingPool: { $regex: req.body.search, $options: "i" } },
      ];
    }
  
    return query;
  };
  
  const formatResturantData = (resturant: any) => {
    return {
      id: resturant._id,
      foodOptions: resturant.foodOptions,
      noOfOccupancy: resturant.noOfOccupancy,
      floor: resturant.floor,
      swimmingPool: resturant.swimmingPool,
      createdAt: resturant.createdAt
        ? new Date(resturant.createdAt).toLocaleDateString()
        : "",
      updatedAt: resturant.updatedAt
        ? new Date(resturant.updatedAt).toLocaleDateString()
        : "",
    };
  };
  
  const processResturantFields = (fields: string[]) => {
    const fieldMapping = {
      id: { key: "id", header: "ID", width: 15 },
      foodOptions: { key: "foodOptions", header: "Food Options", width: 25 },
      noOfOccupancy: { key: "noOfOccupancy", header: "Occupancy", width: 20 },
      floor: { key: "floor", header: "Floor", width: 15 },
      swimmingPool: { key: "swimmingPool", header: "Swimming Pool", width: 20 },
      createdAt: { key: "createdAt", header: "Created At", width: 20 },
      updatedAt: { key: "updatedAt", header: "Updated At", width: 20 },
    };
  
    if (fields.length === 0) {
      return Object.values(fieldMapping);
    }
  
    return fields
      .map((field: string) => fieldMapping[field as keyof typeof fieldMapping])
      .filter((item) => Boolean(item));
  };
  
  export const downloadResturantTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Resturant Template", {
        pageSetup: { paperSize: 9, orientation: "landscape" },
      });
  
      // Define template columns
      worksheet.columns = [
        { header: "Food Options", key: "foodOptions", width: 25 },
        { header: "No. of Occupancy", key: "noOfOccupancy", width: 15 },
        { header: "Floor", key: "floor", width: 15 },
        { header: "Swimming Pool", key: "swimmingPool", width: 15 },
      ];
  
      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
  
      // Add example data
      worksheet.addRow({
        foodOptions: "Vegetarian, Non-Vegetarian",
        noOfOccupancy: "50",
        floor: "Ground Floor",
        swimmingPool: "Yes",
      });
  
      // Add instructions
      const instructionSheet = workbook.addWorksheet("Instructions");
      instructionSheet.columns = [
        { header: "Field", key: "field", width: 20 },
        { header: "Description", key: "description", width: 50 },
        { header: "Required", key: "required", width: 10 },
      ];
  
      // Style the header row
      const instHeaderRow = instructionSheet.getRow(1);
      instHeaderRow.font = { bold: true };
      instHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
  
      // Add instructions
      const instructions = [
        {
          field: "Food Options",
          description: "Types of food options available",
          required: "No",
        },
        {
          field: "No. of Occupancy",
          description: "Maximum number of people the restaurant can accommodate",
          required: "No",
        },
        {
          field: "Floor",
          description: "Floor location of the restaurant",
          required: "No",
        },
        {
          field: "Swimming Pool",
          description: "Whether the restaurant has a swimming pool",
          required: "No",
        },
      ];
  
      instructions.forEach((instruction) => {
        instructionSheet.addRow(instruction);
      });
  
      // Generate file
      const timestamp = new Date().getTime();
      const filename = `resturant_import_template_${timestamp}.xlsx`;
      const directory = path.join("public", "uploads");
  
      // Ensure directory exists
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
  
      const filePath = path.join(directory, filename);
      await workbook.xlsx.writeFile(filePath);
  
      res.json({
        status: "success",
        message: "Template downloaded successfully",
        filename: filename,
      });
    } catch (error) {
      console.error("Template download error:", error);
      next(error);
    }
}