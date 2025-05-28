import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { TaskManagement } from "@models/taskManagement.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import { User } from "@models/user.model";
import { sendMessageToUser } from "@helpers/socket";
import { Notification } from "@models/notification.model";
import { match } from "assert";
// import { io } from "../../server"; // Import io from server.ts

// export const setupSocket = () => {
//   io.on("connection", (socket: any) => {
//     console.log("New connection:", socket.id);

//     socket.on("disconnect", () => {
//       console.log("User disconnected:", socket.id);
//     });
//   });
// };

// setTimeout(() => {
//   sendMessageToUser("67ab646fe5d5799c01595d5e", "hello");
// }, 10000);

export const addTaskManagement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // let existsCheck = await TaskManagement.findOne({: req.body.phone }).exec();
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

    sendMessageToUser(req.body.assignedTo, `You have been assigned a new task: ${req.body.taskTitle}`);

    const taskManagement = await new TaskManagement({
      ...req.body,
      userId: req.body.reassignments.res,
    }).save();


    if (taskManagement.assignedTo) {
      const notification = await new Notification({
        message: `You have been assigned a new task: ${req.body.taskTitle}`,
        userId: taskManagement.assignedTo.toString(),
      }).save();
    }


    // const taskManagement1 = await new TaskManagement({
    //   ...req.body,
    //   userId: req.body.userId
    // }).save();

    // const assignedTo = taskManagement1.assignedTo.toString();
    // io.to(assignedTo).emit("taskAssigned", {
    //   message: `You have been assigned a new task: ${taskManagement1.taskTitle}`,
    //   taskId: taskManagement1._id,
    //   assignedTo,
    //   taskTitle: taskManagement1.taskTitle,
    //   description: taskManagement1.description,
    //   startDate: taskManagement1.startDate,
    // });





    res
      .status(201)
      .json({ message: "TaskManagement Created", data: taskManagement });
  } catch (error) {
    next(error);
  }
};

export const getAllTaskManagement = async (req: any, res: any, next: any) => {
  try {
    let matchObj: Record<string, any> = {};


    console.log(req.query.query, "assignedTo");

    let pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          assignedToName: { $ifNull: ["$user.name", "$assignedTo"] },
        },
      },
      {
        $unset: "user",
      },
      {
        $match: {
          assignedToName: new RegExp(req.query.query, "i"),
        },
      },
    ];

    pipeline.push({
      $match: matchObj,
    });




    let TaskManagementArr = await paginateAggregate(
      TaskManagement,
      pipeline,
      req.query
    );

    res.status(201).json({
      message: "found all Device",
      data: TaskManagementArr.data,
      total: TaskManagementArr.total,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTasks = async (req: any, res: any, next: any) => {
  try {

    console.log(req.user.userId, "req.user.userId");
    let matchObj: Record<string, any> = {};
    console.log("Request User:", req.user);

    if (req.user && req.user.userId) {
      matchObj["assignedTo"] = req.user.userId;
    } else {
      throw new Error("User not authenticated");
    }

    console.log("Match Object:", matchObj);

    let TaskManagementArr = await paginateAggregate(
      TaskManagement,
      [{ $match: matchObj }],
      req.query
    );

    console.log("Task Management Array:", TaskManagementArr);

    res.status(201).json({
      message: "found all Device",
      data: TaskManagementArr.data,
      total: TaskManagementArr.total,
    });
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};

export const getTaskManagementById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId || !mongoose.Types.ObjectId.isValid(req.user.userId)) {
      throw new Error("Invalid TaskManagement ID");
    }

    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {
      _id: new mongoose.Types.ObjectId(req.user.userId),
    };

    pipeline = [
      { $match: matchObj },
      { $unwind: { path: "$reassignments", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { reassignments: { $exists: false } },
            { "reassignments.reAssignedTo": { $exists: true, $ne: null } },
          ],
        },
      },
      {
        $addFields: {
          reAssignedTo: {
            $cond: {
              if: {
                $and: [
                  { $ifNull: ["$reassignments.reAssignedTo", false] },
                  { $eq: [{ $strLenCP: "$reassignments.reAssignedTo" }, 24] },
                ],
              },
              then: { $toObjectId: "$reassignments.reAssignedTo" },
              else: "$reassignments.reAssignedTo",
            },
          },
          previousAssignee: {
            $cond: {
              if: {
                $and: [
                  { $ifNull: ["$reassignments.previousAssignee", false] },
                  {
                    $eq: [{ $strLenCP: "$reassignments.previousAssignee" }, 24],
                  },
                ],
              },
              then: { $toObjectId: "$reassignments.previousAssignee" },
              else: "$reassignments.previousAssignee",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reAssignedTo",
          foreignField: "_id",
          as: "reassignedUsers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "previousAssignee",
          foreignField: "_id",
          as: "previousAssigneeUsers",
        },
      },
      {
        $unwind: { path: "$reassignedUsers", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: {
          path: "$previousAssigneeUsers",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "reassignments.previousAssigneeName": "$previousAssigneeUsers.name",
          "reassignments.assignedName": "$reassignedUsers.name",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      { $addFields: { assignedToName: "$user.name" } },
      { $unset: ["user", "reassignedUsers", "previousAssigneeUsers"] },
      {
        $group: {
          _id: "$_id",
          assignedTo: { $first: "$assignedTo" },
          assignedToName: { $first: "$assignedToName" },
          department: { $first: "$department" },
          taskType: { $first: "$taskType" },
          taskTitle: { $first: "$taskTitle" },
          description: { $first: "$description" },
          startDate: { $first: "$startDate" },
          startTime: { $first: "$startTime" },
          timeType: { $first: "$timeType" },
          timeValue: { $first: "$timeValue" },
          completionTime: { $first: "$completionTime" },
          options: { $first: "$options" },
          reassignments: {
            $push: {
              $cond: {
                if: { $eq: ["$reassignments", {}] },
                then: "$$REMOVE",
                else: "$reassignments",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          assignedTo: 1,
          assignedToName: 1,
          department: 1,
          taskType: 1,
          taskTitle: 1,
          description: 1,
          startDate: 1,
          startTime: 1,
          timeType: 1,
          timeValue: 1,
          completionTime: 1,
          options: 1,
          reassignments: {
            $cond: {
              if: { $eq: [{ $size: "$reassignments" }, 0] },
              then: [],
              else: {
                $filter: {
                  input: "$reassignments",
                  cond: { $ne: ["$$this", null] },
                },
              },
            },
          },
        },
      },
    ];
    let existsCheck = await TaskManagement.aggregate(pipeline);
    if (!existsCheck || existsCheck.length === 0) {
      throw new Error("TaskManagement does not exist");
    }
    existsCheck = existsCheck[0];
    res
      .status(200)
      .json({ message: "Found specific Contact", data: existsCheck });
  } catch (error) {
    next(error);
  }
};

export const updateTaskManagementById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let existsCheck = await TaskManagement.findById(req.params.id)
      .lean()
      .exec();
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
    let Obj = await TaskManagement.findByIdAndUpdate(
      req.params.id,
      req.body
    ).exec();

    // let notification = await new Notification({
    //   assignedTo: req.body.assignedTo,
    // })

    res.status(201).json({ message: "TaskManagement Updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteTaskManagementById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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