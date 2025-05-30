import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { LeadManagement } from "@models/leadManagement.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import { User } from "@models/user.model";
import { buildRoleHierarchy } from "../../util/buildRoleHierarchy";
import { Roles } from "@models/roles.model";

export const addLeadManagement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // let existsCheck = await leadManagement.findOne({ name: req.body.phone }).exec();
    // if (existsCheck) {
    //     throw new Error("leadManagement with same email already exists");
    // }

    // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
    //     console.log("first", req.body.imagesArr)
    //     for (const el of req.body.imagesArr) {
    //         if (el.image && el.image !== "") {
    //             el.image = await storeFileAndReturnNameBase64(el.image);
    //         }
    //     }
    // }

    const user = await User.findById(req.body.userId).lean().exec();
    if (!user) {
      throw new Error("User not found");
    }

    const role = await Roles.findOne({
      roleName: user?.role?.toUpperCase(),
    })
      .lean()
      .exec();
    if (!role) {
      throw new Error("Role not found");
    }

    const userArray = await User.find({ role: role?.parentRole }).lean().exec();
    if (!userArray) {
      throw new Error("User not found");
    }

    for (const userElement of userArray) {
      const leadManagementArray = await new LeadManagement({
        userId: userElement._id,
        leadIds: [req.body.leadId],
      }).save();
    }

    const leadManagement = await new LeadManagement(req.body).save();

    res.status(201).json({ message: "leadManagement Created" });
  } catch (error) {
    next(error);
  }
};

export const getAllLeadManagement = async (req: any, res: any, next: any) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};
    if (req.query.query && req.query.query != "") {
      matchObj.name = new RegExp(req.query.query, "i");
    }
    pipeline.push({
      $match: matchObj,
    });

    let leadManagementArr = await paginateAggregate(
      LeadManagement,
      pipeline,
      req.query
    );

    res.status(201).json({
      message: "found all Device",
      data: leadManagementArr.data,
      total: leadManagementArr.total,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadManagementById = async (
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
    let existsCheck = await LeadManagement.aggregate(pipeline);
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

export const updateLeadManagementById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await LeadManagement.findById(req.params.id)
      .lean()
      .exec();
    if (!existsCheck) {
      throw new Error("leadManagement does not exists");
    }

    // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
    //     for (const el of req.body.imagesArr) {
    //         if (el.images && el.images !== "" && el.images.includes("base64")) {
    //             el.images = await storeFileAndReturnNameBase64(el.images);
    //         }
    //     }
    // }
    await LeadManagement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).exec();

    if (req.body.leadId) {
      const parentRoleUsers = await User.find({ role: req.body.parentRole })
        .lean()
        .exec();
      for (const user of parentRoleUsers) {
        await LeadManagement.updateMany(
          { userId: user._id },
          { $addToSet: { leadIds: req.body.leadId } }
        ).exec();
      }
    }
    res.status(201).json({ message: "leadManagement Updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteLeadManagementById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await LeadManagement.findById(req.params.id).exec();
    if (!existsCheck) {
      throw new Error("leadManagement does not exists or already deleted");
    }
    await LeadManagement.findByIdAndDelete(req.params.id).exec();
    res.status(201).json({ message: "leadManagement Deleted" });
  } catch (error) {
    next(error);
  }
};

export const getLeadManagementByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id).exec();

    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};
    if (req.params.id) {
      matchObj._id = new mongoose.Types.ObjectId(req.params.id);
    }
    pipeline.push({
      $match: matchObj,
    });

    let checkleadManagement = await LeadManagement.findOne({
      role: user?.role,
    }).exec();

    let existsCheck = await LeadManagement.aggregate(pipeline);
    if (!existsCheck || existsCheck.length == 0) {
      throw new Error("leadManagement does not exists");
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

export const getLeadManagementByRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};

    if (req.params.role) {
      matchObj.roleName = req.params.role;
    }
    pipeline.push({
      $match: matchObj,
    });
    let existsCheck = await LeadManagement.aggregate(pipeline);
    if (!existsCheck || existsCheck.length == 0) {
      throw new Error("leadManagement does not exists");
    }
    existsCheck = existsCheck[0];
    res.status(201).json({
      message: "found specific leadManagement",
      data: existsCheck,
    });
  } catch (error) {
    next(error);
  }
};
