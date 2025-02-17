import { model, Model, Schema, Types } from "mongoose";
import mongoose from "mongoose";


export interface IReassignTask {
    taskId: Types.ObjectId
    reAssignedTo: string;
    department: string;
    remark: string;
    previousAssignee: string;
    description: string;
    reAssignmentDate: string;
    taskTitle: string;
    // startTime: string;
    // timeType: string;
    // timeValue: number | "";
    // completionTime: string;
    // options: number[];
}

const ReassignTaskSchema = new mongoose.Schema({

    reAssignedTo: String,
    department: String,
    remark: String,
    previousAssignee: String,
    description: String,
    reAssignmentDate: String,
    taskTitle: String,
    // startTime: String,
    // timeType: String,
    // timeValue: Number | "",
    // completionTime: String,
    // options: Number[],
});



export const ReassignTask = model<IReassignTask>("ReassignTask", ReassignTaskSchema);
