import mongoose, { Schema, Types, model } from "mongoose";

export interface IMonthlyPlannerSchema{
    date: Date;
    clientName: string;
    company: string;
    agenda: string;
    status: string;
    
}

const MonthlyPlannerSchema = new Schema(
    {

        date: Date,
        clientName: String,
        company: String,
        agenda: String,
        status: String,
     




    },
    { timestamps: true }
);

export const MonthlyPlanner = model<IMonthlyPlannerSchema>("monthlyPlanner", MonthlyPlannerSchema);