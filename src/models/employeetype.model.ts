import { model, Schema } from "mongoose";

export interface IEmployeeType {
    name: string,
    color: string,
    status: {
        default: true,
        type: boolean,
    }
};

const employeeType = new Schema<IEmployeeType>({
    name: String,
    color: String,
    status: {
        default: true,
        type: Boolean,
    }
}, { timestamps: true });

export const EmployeeType = model<IEmployeeType>("employeeTypes", employeeType);
