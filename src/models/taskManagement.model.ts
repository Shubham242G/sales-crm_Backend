import mongoose, { model, Model, Schema, Types } from "mongoose";


export interface IReassignment {
    reAssignedTo: string;
    remark: string;
    previousAssignee: string;
    reAssignmentDate: string;
  }


export interface ITaskManagement {
    id?: string;
    userId: Types.ObjectId;
    assignedTo: Types.ObjectId;
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

const taskSchema = new mongoose.Schema({
    userId: Types.ObjectId,
    assignedTo: Types.ObjectId,
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
    reassignments: [{
        reAssignedTo: String,
        remark: String,
        previousAssignee: String,
        reAssignmentDate: String,
    }],
   
});


export const TaskManagement = model<ITaskManagement>("Task", taskSchema);
