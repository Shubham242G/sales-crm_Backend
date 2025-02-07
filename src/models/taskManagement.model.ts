import { model, Model, Schema, Types } from "mongoose";
import mongoose from "mongoose";


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
}

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
});



export const Task = model<ITaskManagement>("Task", taskSchema);
