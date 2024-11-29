import mongoose, { model, Schema } from "mongoose";

export interface Shift {
    name: String,
    startTime: String,
    endTime: String,
    isBreakOneAllowed: boolean,
    isBreakTwoAllowed: boolean,
    breakOneStartTime: String,
    breakOneEndTime: String,
    breakTwoStartTime: String,
    breakTwoEndTime: String,
    partialDay: String,
    isFlexibleShift: boolean,
    punchBeginBefore: number,
    punchEndAfter: number,
    graceTime: number,
    isPartialDay: boolean,
    partialDayStartTime: String,
    partialDayEndTime: String,
    selectedWeekOffs: [],
    status: {
        default: true,
        type: boolean,
    }
};

const shift = new Schema<Shift>({
    name: String,
    startTime: String,
    endTime: String,
    isBreakOneAllowed: Boolean,
    isBreakTwoAllowed: Boolean,
    breakOneStartTime: String,
    breakOneEndTime: String,
    breakTwoStartTime: String,
    breakTwoEndTime: String,
    partialDay: String,
    isFlexibleShift: Boolean,
    punchBeginBefore: Number,
    punchEndAfter: Number,
    graceTime: Number,
    isPartialDay: Boolean,
    partialDayStartTime: String,
    partialDayEndTime: String,
    selectedWeekOffs: [],
    status: {
        default: true,
        type: Boolean,
    }
}, { timestamps: true });

export const Shift = model<Shift>("shift", shift);