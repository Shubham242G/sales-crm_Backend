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
import { ExportService } from "../../util/excelfile"
import path from "path";
import ExcelJs from "exceljs";
import fs from "fs";
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
    let matchObj: Record<string, any> = {
      assignedTo: new mongoose.Types.ObjectId(req.user.userId)
    };



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

export const downloadExcelTask = async (
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
    model: TaskManagement,
    buildQuery: buildTaskQuery, 
    formatData: formatTaskData,
    processFields: processTaskFields,
    filename: isSelectedExport ? "selected_tasks" : "tasks",
    worksheetName: isSelectedExport ? "Selected Tasks" : "Tasks",
    title: isSelectedExport ? "Selected Tasks" : "Tasks",
  });
};

const buildTaskQuery = (req: Request) => {
  const query: any = {};

  // Check if specific IDs are selected (tickRows)
  if (
    req.body.tickRows &&
    Array.isArray(req.body.tickRows) &&
    req.body.tickRows.length > 0
  ) {
    // If tickRows is provided, only export selected records
    console.log("Exporting selected tasks:", req.body.tickRows.length);
    query._id = { $in: req.body.tickRows };
    return query; // Return early, ignore other filters when exporting selected rows
  }

  // If no tickRows, apply regular filters
  console.log("Exporting filtered tasks");

  if (req.body.department) {
    query.department = req.body.department;
  }

  if (req.body.taskType) {
    query.taskType = req.body.taskType;
  }

  if (req.body.assignedTo) {
    query.assignedTo = req.body.assignedTo;
  }

  if (req.body.dateFrom && req.body.dateTo) {
    query.startDate = {
      $gte: new Date(req.body.dateFrom),
      $lte: new Date(req.body.dateTo),
    };
  }

  // Add search functionality if needed
  if (req.body.search) {
    query.$or = [
      { taskTitle: { $regex: req.body.search, $options: "i" } },
      { description: { $regex: req.body.search, $options: "i" } },
    ];
  }

  return query;
};

const formatTaskData = (task: any) => {
  // You might want to populate these fields if they're references
  const assignedTo = task.assignedTo.toString(); // Convert to string or populate name
  const department = task.department;
  const taskType = task.taskType;

  return {
    id: task._id,
    taskTitle: task.taskTitle,
    description: task.description,
    department: department,
    taskType: taskType,
    assignedTo: assignedTo,
    startDate: task.startDate,
    startTime: task.startTime,
    timeType: task.timeType,
    timeValue: task.timeValue,
    completionTime: task.completionTime,
    status: task.status,
    reassignmentCount: task.reassignments?.length || 0,
    createdAt: task.createdAt,
  };
};

const processTaskFields = (fields: string[]) => {
  const fieldMapping = {
    id: { key: "id", header: "ID", width: 15 },
    taskTitle: { key: "taskTitle", header: "Task Title", width: 30 },
    description: { key: "description", header: "Description", width: 40 },
    department: { key: "department", header: "Department", width: 20 },
    taskType: { key: "taskType", header: "Task Type", width: 20 },
    assignedTo: { key: "assignedTo", header: "Assigned To", width: 25 },
    startDate: { key: "startDate", header: "Start Date", width: 15 },
    startTime: { key: "startTime", header: "Start Time", width: 15 },
    timeType: { key: "timeType", header: "Time Type", width: 15 },
    timeValue: { key: "timeValue", header: "Time Value", width: 15 },
    completionTime: { key: "completionTime", header: "Completion Time", width: 20 },
    status: { key: "status", header: "Status", width: 15 },
    reassignmentCount: { key: "reassignmentCount", header: "Reassignments", width: 15 },
    createdAt: { key: "createdAt", header: "Created At", width: 20 },
  };

  if (fields.length === 0) {
    // Return all fields if none specified
    return Object.values(fieldMapping);
  }

  return fields
    .map((field: string) => fieldMapping[field as keyof typeof fieldMapping])
    .filter((item) => Boolean(item));
};

export const downloadTaskTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Task Template", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Define template columns
    worksheet.columns = [
      { header: "Task Title*", key: "taskTitle", width: 30 },
      { header: "Description*", key: "description", width: 40 },
      { header: "Department*", key: "department", width: 20 },
      { header: "Task Type*", key: "taskType", width: 20 },
      { header: "Assigned To*", key: "assignedTo", width: 25 },
      { header: "Start Date*", key: "startDate", width: 15 },
      { header: "Start Time", key: "startTime", width: 15 },
      { header: "Time Type", key: "timeType", width: 15 },
      { header: "Time Value", key: "timeValue", width: 15 },
      { header: "Status", key: "status", width: 15 },
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
      taskTitle: "Sample Task",
      description: "This is a sample task description",
      department: "IT",
      taskType: "Development",
      assignedTo: "user@example.com",
      startDate: new Date(),
      startTime: "09:00",
      timeType: "hours",
      timeValue: 2,
      status: "Pending",
    });

    // Add dropdown validations
    // Department dropdown (example values)
    worksheet.getCell("C2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"IT,HR,Finance,Operations,Marketing"'],
    };

    // Task Type dropdown (example values)
    worksheet.getCell("D2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Development,Testing,Meeting,Documentation,Review"'],
    };

    // Status dropdown
    worksheet.getCell("J2").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Pending,In Progress,Completed,On Hold,Cancelled"'],
    };

    // Time Type dropdown
    worksheet.getCell("H2").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"minutes,hours,days"'],
    };

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
        field: "Task Title",
        description: "Title of the task",
        required: "Yes",
      },
      {
        field: "Description",
        description: "Detailed description of the task",
        required: "Yes",
      },
      {
        field: "Department",
        description: "Department responsible for the task",
        required: "Yes",
      },
      {
        field: "Task Type",
        description: "Type/Category of the task",
        required: "Yes",
      },
      {
        field: "Assigned To",
        description: "Email of the person assigned to the task",
        required: "Yes",
      },
      {
        field: "Start Date",
        description: "Date when task should start (YYYY-MM-DD)",
        required: "Yes",
      },
      {
        field: "Start Time",
        description: "Time when task should start (HH:MM)",
        required: "No",
      },
      {
        field: "Time Type",
        description: "Type of time estimation (minutes, hours, days)",
        required: "No",
      },
      {
        field: "Time Value",
        description: "Estimated time required for the task",
        required: "No",
      },
      {
        field: "Status",
        description: "Current status of the task",
        required: "No",
      },
    ];

    instructions.forEach((instruction) => {
      instructionSheet.addRow(instruction);
    });

    // Generate file
    const timestamp = new Date().getTime();
    const filename = `task_import_template_${timestamp}.xlsx`;
    const directory = path.join("public", "uploads");

    // Ensure directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const filePath = path.join(directory, filename);
    await workbook.xlsx.writeFile(filePath);

    res.json({
      status: "success",
      message: "Task template downloaded successfully",
      filename: filename,
    });
  } catch (error) {
    console.error("Task template download error:", error);
    next(error);
  }
};