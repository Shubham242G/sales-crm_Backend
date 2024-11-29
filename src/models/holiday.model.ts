import mongoose, { model, Schema } from "mongoose";

export interface IHoliday {
    name: string,
    on: Date,
    status: {
        default: true,
        type: boolean,
    }
};

const holiday = new Schema<IHoliday>({
    name: String,
    on: Date,
    status: {
        default: true,
        type: Boolean,
    }
}, { timestamps: true });

export const Holiday = model<IHoliday>("holidays", holiday);
