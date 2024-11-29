import mongoose, { model, Schema } from "mongoose";

export interface IDevice {
    name: string,
    deviceCode: string,
    status: {
        default: true,
        type: boolean,
    }
};

const device = new Schema<IDevice>({
    name: String,
    deviceCode: String,
    status: {
        default: true,
        type: Boolean,
    }
}, { timestamps: true });

export const Device = model<IDevice>("devices", device);
