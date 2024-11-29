import { model, Schema } from "mongoose";

export interface LeaveTypeType {
    name: string,
    shortName: string,
    yearlyLimit: number,
    carryForwardLimit: number,
    isAddedInDuration: boolean,
    durationInMonths: number,
    countToBeAddedInDuration: number,
    considerAs: string,
    description: string,
    allowNegativeBalance: boolean,
    status: {
        default: true,
        type: boolean,
    }
};

const leaveType = new Schema<LeaveTypeType>({
    name: String,
    shortName: String,
    yearlyLimit: Number,
    carryForwardLimit: Number,
    isAddedInDuration: Boolean,
    durationInMonths: Number,
    countToBeAddedInDuration: Number,
    considerAs: String,
    description: String,
    allowNegativeBalance: Boolean,
    status: {
        default: true,
        type: Boolean,
    }
}, { timestamps: true });

export const LeaveType = model<LeaveTypeType>("leaveType", leaveType);
