import { model, Model, Schema, Types } from "mongoose";
import mongoose from "mongoose";

export interface IReassignment {
    reAssignedTo: string;
    remark: string;
    previousAssignee: string;
    reAssignmentDate: string;
  }

export interface ITaskManagement {
    id?: string;
    assignedTo: string;
    department: string;
    taskType: string;
    taskTitle: string;
    description: string;
    startDate: string;
    startTime: string;
    timeType: string;
    timeValue: number | "";
    completionTime: string;
    options: number[];
    reassignments?: IReassignment[];
}

const reassignmentSchema = new mongoose.Schema({
    reAssignedTo: String,
    remark: String,
    previousAssignee: String,
    reAssignmentDate: String
});

const taskSchema = new mongoose.Schema({
    assignedTo: String,
    department: String,
    taskType: String,
    taskTitle: String,
    description: String,
    startDate: String,
    startTime: String,
    timeType: String,
    timeValue: Number,
    completionTime: String,
    options: [Number],
    reassignments: [reassignmentSchema]
});



export const Task = model<ITaskManagement>("Task", taskSchema);
