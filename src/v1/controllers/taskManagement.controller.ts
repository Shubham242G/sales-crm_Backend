
import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { TaskManagement} from "@models/taskManagement.model"
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import { User } from "@models/user.model";






export const addTaskManagement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await TaskManagement.findOne({ name: req.body.phone }).exec();
        // if (existsCheck) {
        //     throw new Error("TaskManagement with same email already exists");
        // }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     console.log("first", req.body.imagesArr)
        //     for (const el of req.body.imagesArr) {
        //         if (el.image && el.image !== "") {
        //             el.image = await storeFileAndReturnNameBase64(el.image);
        //         }
        //     }
        // }


 
       
       
        const taskManagement = await new TaskManagement({...req.body , userId: req.body.reassignments.res} ).save();
        res.status(201).json({ message: "TaskManagement Created" });


    } catch (error) {
        next(error);
    }
};

export const getAllTaskManagement = async (req: any, res: any, next: any) => {
    try {
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }

        let pipeline: PipelineStage[] = [{
            $lookup:{
                    from:"users",
                    localField:"assignedTo",
                    foreignField:"_id",
                    as:"user"
            },

        },
        {
            $unwind:{
                path:"$user",
                preserveNullAndEmptyArrays: false
            }
        },{
            $addFields:{
                assignedToName:"$user.name"
            },
        }  ,
        {
            $unset:"user"
        }
        ];

        pipeline.push({
            $match: matchObj,
        });
        let TaskManagementArr = await paginateAggregate(TaskManagement, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: TaskManagementArr.data, total: TaskManagementArr.total });
    } catch (error) {
        next(error);
    }
};

export const getMyTasks = async (req: any, res: any, next: any) => {
    try {
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
      

        let pipeline: PipelineStage[] = [

            {
                $match:{
                    $or:[
                    {  assignedTo: new mongoose.Types.ObjectId(req.user.userId),},
                   { "reassignments.previousAssignee": (req.user.userId),}
            ]
            },
        },{
            $lookup:{
                    from:"users",
                    localField:"assignedTo",
                    foreignField:"_id",
                    as:"user"
            },

        },
        {
            $unwind:{
                path:"$user",
                preserveNullAndEmptyArrays: false
            }
        },{
            $addFields:{
                assignedToName:"$user.name"
            },
        }  ,
        {
            $unset:"user"
        }
        ];

        pipeline.push({
            $match: matchObj,
        });
        let TaskManagementArr = await paginateAggregate(TaskManagement, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: TaskManagementArr.data, total: TaskManagementArr.total });
    } catch (error) {
        next(error);
    }
};

export const getTaskManagementById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline=[{
            $match: matchObj,
        },
        {
            $unwind: {
              path: "$reassignments",
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $addFields: {
              reAssignedTo: {
                $toObjectId: "$reassignments.reAssignedTo"
              },
              previousAssignee: {
                $toObjectId:
                  "$reassignments.previousAssignee"
              }
            }
          },
          {
            // Lookup for reAssignedTo user in each reassignments array element
            $lookup: {
              from: "users",
              localField: "reAssignedTo",
              foreignField: "_id",
              as: "reassignedUsers"
            }
          },
          {
            // Lookup for previousAssignee in each reassignments array element
            $lookup: {
              from: "users",
              localField: "previousAssignee",
              foreignField: "_id",
              as: "previousAssigneeUsers"
            }
          },
          {
            $unwind: {
              path: "$reassignedUsers",
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $unwind: {
              path: "$previousAssigneeUsers",
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $addFields:
              /**
               * newField: The new field name.
               * expression: The new field expression.
               */
              {
                "reassignments.previousAssigneeName":
                  "$previousAssigneeUsers.name",
                "reassignments.assignedName":
                  "$reassignedUsers.name"
              }
          },
          {
            $lookup: {
              from: "users",
              localField: "assignedTo",
              foreignField: "_id",
              as: "user"
            }
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $addFields: {
              assignedToName: "$user.name"
            }
          },
          {
            $unset: [
              "user",
              "reassignedUsers",
              "previousAssigneeUsers"
            ]
          },
          {
            $group: {
              _id: "$_id",
              assignedTo: {
                $first: "$assignedTo"
              },
              assignedToName: {
                $first: "$assignedToName"
              },
              taskTitle: {
                $first: "$taskTitle"
              },
              description: {
                $first: "$description"
              },
              startDate: {
                $first: "$startDate"
              },
              startTime: {
                $first: "$startTime"
              },
              timeType: {
                $first: "$timeType"
              },
              timeValue: {
                $first: "$timeValue"
              },
              completionTime: {
                $first: "$completionTime"
              },
              options: {
                $first: "$options"
              },
              reassignments: {
                $push: "$reassignments"
              }
            }
          }];
        let existsCheck = await TaskManagement.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("TaskManagement does not exists");
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

export const updateTaskManagementById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await TaskManagement.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("TaskManagement does not exists");
        }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     for (const el of req.body.imagesArr) {
        //         if (el.images && el.images !== "" && el.images.includes("base64")) {
        //             el.images = await storeFileAndReturnNameBase64(el.images);
        //         }
        //     }
        // }
        let Obj = await TaskManagement.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "TaskManagement Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteTaskManagementById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await TaskManagement.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("TaskManagement does not exists or already deleted");
        }
        await TaskManagement.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "TaskManagement Deleted" });
    } catch (error) {
        next(error);
    }
};