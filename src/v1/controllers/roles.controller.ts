
import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import {Roles} from "@models/roles.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import { User } from "@models/user.model";
import { buildRoleHierarchy } from "../../util/buildRoleHierarchy";
import ExcelJs from "exceljs";
import path from "path";
import fs from "fs";
import { ExportService } from "../../util/excelfile";






export const addroles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await roles.findOne({ name: req.body.phone }).exec();
        // if (existsCheck) {
        //     throw new Error("roles with same email already exists");
        // }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     console.log("first", req.body.imagesArr)
        //     for (const el of req.body.imagesArr) {
        //         if (el.image && el.image !== "") {
        //             el.image = await storeFileAndReturnNameBase64(el.image);
        //         }
        //     }
        // }

        
        const roles = await new Roles(req.body).save();
        res.status(201).json({ message: "roles Created" });


    } catch (error) {
        next(error);
    }
};

export const getAllroles = async (req: any, res: any, next: any) => {
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
            roleName: {
            $regex: new RegExp(
              `${typeof req?.query?.query === "string" ? req.query.query : ""}`,
              "i"
            ),
          },
        },

   
        {
            description: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          phoneNo: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          name: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          email: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
            designation: new RegExp(
              typeof req?.query?.query === "string" ? req.query.query : "",
              "i"
            ),
          },
          {
            department: new RegExp(
              typeof req?.query?.query === "string" ? req.query.query : "",
              "i"
            ),
          },

        
        //check for fullName
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



        let rolesArr = await paginateAggregate(Roles, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: rolesArr.data, total: rolesArr.total });
    } catch (error) {
        next(error);
    }
};

export const getrolesById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Roles.aggregate(pipeline);
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

export const updaterolesById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Roles.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("roles does not exists");
        }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     for (const el of req.body.imagesArr) {
        //         if (el.images && el.images !== "" && el.images.includes("base64")) {
        //             el.images = await storeFileAndReturnNameBase64(el.images);
        //         }
        //     }
        // }
        let Obj = await Roles.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "roles Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleterolesById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Roles.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("roles does not exists or already deleted");
        }
        await Roles.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "roles Deleted" });
    } catch (error) {
        next(error);
    }
};



export const getrolesByUser = async (req: Request, res: Response, next: NextFunction) => {
    try {


        const user= await User.findById(req.params.id).exec();



        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });

        let checkRoles = await Roles.findOne({ role: user?.role}).exec();

     
        let existsCheck = await Roles.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Roles does not exists");
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



export const getrolesByRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};


        if (req.params.role) {
            matchObj.roleName = req.params.role
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Roles.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Roles does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Roles",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};


export const getRolesHierarchy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch all roles from the database
        const roles = await Roles.find().populate('parentRole'); // Populate parentRole to avoid manual population in the hierarchy function
        const hierarchy = buildRoleHierarchy(roles);
        res.status(201).json({
            message: "found specific RoleHierarchy",
            data: hierarchy,
        });
        
      } catch (error) {
        next(error);
    }
};

export const downloadExcelRoles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const isSelectedExport =
      req.body.tickRows &&
      Array.isArray(req.body.tickRows) &&
      req.body.tickRows.length > 0;
  
    return ExportService.downloadFile(req, res, next, {
      model: Roles,
      buildQuery: buildRoleQuery,
      formatData: formatRoleData,
      processFields: processRoleFields,
      filename: isSelectedExport ? "selected_roles" : "roles",
      worksheetName: isSelectedExport ? "Selected Roles" : "All Roles",
      title: isSelectedExport ? "Selected Roles" : "Role List",
    });
  };

  const buildRoleQuery = (req: Request) => {
    const query: any = {};
  
    // Handle selected rows export
    if (req.body.tickRows?.length > 0) {
      query._id = { $in: req.body.tickRows };
      return query;
    }
  
    // Apply regular filters
    if (req.body.department) {
      query.department = req.body.department;
    }
  
    if (req.body.designation) {
      query.designation = req.body.designation;
    }
  
    if (req.body.parentRole) {
      query.parentRole = req.body.parentRole;
    }
  
    if (req.body.search) {
      query.$or = [
        { roleName: { $regex: req.body.search, $options: "i" } },
        { name: { $regex: req.body.search, $options: "i" } },
        { email: { $regex: req.body.search, $options: "i" } },
        { designation: { $regex: req.body.search, $options: "i" } },
      ];
    }
  
    return query;
  };

  const formatRoleData = (role: any) => {
    return {
      id: role._id,
      roleName: role.roleName,
      description: role.description,
      name: role.name,
      email: role.email,
      phoneNo: role.phoneNo,
      designation: role.designation,
      department: role.department,
      parentRole: role.parentRole?.toString() || 'None',
      createdAt: role.createdAt?.toLocaleDateString() || '',
      updatedAt: role.updatedAt?.toLocaleDateString() || '',
    };
  };

  const processRoleFields = (fields: string[]) => {
    const fieldMapping = {
      id: { key: "id", header: "ID", width: 20 },
      roleName: { key: "roleName", header: "Role Name", width: 25 },
      description: { key: "description", header: "Description", width: 40 },
      name: { key: "name", header: "Contact Name", width: 25 },
      email: { key: "email", header: "Email", width: 30 },
      phoneNo: { key: "phoneNo", header: "Phone", width: 20 },
      designation: { key: "designation", header: "Designation", width: 20 },
      department: { key: "department", header: "Department", width: 20 },
      parentRole: { key: "parentRole", header: "Parent Role ID", width: 25 },
      createdAt: { key: "createdAt", header: "Created At", width: 15 },
      updatedAt: { key: "updatedAt", header: "Updated At", width: 15 },
    };
  
    return fields.length === 0
      ? Object.values(fieldMapping)
      : fields
          .map((field) => fieldMapping[field as keyof typeof fieldMapping])
          .filter(Boolean);
  };

  export const downloadRoleTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Role Template", {
        pageSetup: { paperSize: 9, orientation: "landscape" },
      });
  
      // Define columns
      worksheet.columns = [
        { header: "Role Name*", key: "roleName", width: 25 },
        { header: "Description", key: "description", width: 40 },
        { header: "Contact Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phoneNo", width: 20 },
        { header: "Designation*", key: "designation", width: 20 },
        { header: "Department*", key: "department", width: 20 },
        { header: "Parent Role ID", key: "parentRole", width: 25 },
      ];
  
      // Style header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
  
      // Add data validation for department (example)
      worksheet.getCell("G2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"HR,Finance,Operations,Sales,IT"'], // Replace with your actual departments
      };
  
      // Add sample data
      worksheet.addRow({
        roleName: "Manager",
        designation: "Department Manager",
        department: "Operations",
      });
  
      // Add instructions sheet
      const instructionSheet = workbook.addWorksheet("Instructions");
      instructionSheet.columns = [
        { header: "Field", key: "field", width: 20 },
        { header: "Description", key: "description", width: 50 },
        { header: "Required", key: "required", width: 10 },
      ];
  
      instructionSheet.getRow(1).font = { bold: true };
      instructionSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
  
      const instructions = [
        { field: "Role Name", description: "Name of the role", required: "Yes" },
        { field: "Description", description: "Role description", required: "No" },
        { field: "Contact Name", description: "Primary contact person", required: "No" },
        { field: "Email", description: "Contact email", required: "No" },
        { field: "Phone", description: "Contact phone number", required: "No" },
        { field: "Designation", description: "Job title/position", required: "Yes" },
        { field: "Department", description: "Department this role belongs to", required: "Yes" },
        { field: "Parent Role ID", description: "ID of parent role if hierarchical", required: "No" },
      ];
  
      instructions.forEach(inst => instructionSheet.addRow(inst));
  
      // Generate file
      const filename = `role_import_template_${Date.now()}.xlsx`;
      const filePath = path.join("public", "uploads", filename);
      
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await workbook.xlsx.writeFile(filePath);
  
      res.json({
        status: "success",
        message: "Template downloaded",
        filename,
      });
    } catch (error) {
      console.error("Role template generation failed:", error);
      next(error);
    }
  };









