import mongoose, { Schema, Types, model } from "mongoose";

export interface IMonthlyPlannerSchema{
    date: Date;
    clientName: string;
    company: string;
    agenda: string;
    status: string;
    leadId: Types.ObjectId
    remark: string;
    isRemark: boolean;
}

const MonthlyPlannerSchema = new Schema(
    {

        date: Date,
        clientName: String,
        company: String,
        agenda: String,
        status: String,
        leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
     isRemark: Boolean,
        remark: String




    },
    { timestamps: true }
);

export const MonthlyPlanner = model<IMonthlyPlannerSchema>("monthlyPlanner", MonthlyPlannerSchema);