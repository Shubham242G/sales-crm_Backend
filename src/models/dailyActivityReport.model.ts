import mongoose, { Schema, Types, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
interface customerName {
    label: string;
    value: string
}

export interface IDailyActivityReport {
    companyName: string;
    purposeOfVisit: string;
    leadId: Types.ObjectId
    dateOfVisit: string;
    modeOfMeeting: string;
    customerName: customerName;
    scheduleMeeting: string;
    description: string,
    status: string
}

// 2. Create a Schema corresponding to the document interface.
const dailyActivityReportSchema = new Schema<IDailyActivityReport>(
    {
        companyName: String,
        purposeOfVisit: String,
        dateOfVisit: String,
        leadId: Types.ObjectId,
        modeOfMeeting: String,
        customerName: {
            label: String,
            value: String
        },
        scheduleMeeting: String,
        description: String,
        status: String,
      },
    { timestamps: true }
);

export const DailyActivityReport = model<IDailyActivityReport>("DailyActivityReports", dailyActivityReportSchema);