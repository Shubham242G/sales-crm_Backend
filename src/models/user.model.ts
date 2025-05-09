import { DEPARTMENT, DEPARTMENT_TYPE, ROLES, ROLES_TYPE } from "@common/constant.common";
import mongoose, { Schema, Types, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IUser {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    password: string;
    role: ROLES_TYPE;
    department: DEPARTMENT_TYPE;
    approved: boolean;
    deviceCode: string;
    employeeCode: string;
    reportsToId: mongoose.Types.ObjectId;
    storeId: mongoose.Types.ObjectId;
    displayName: string;
    rawMaterialArr: {
        rawMaterialId: mongoose.Types.ObjectId;
    }[];
    accessObj: {
        manageUsers: boolean;
        manageCategory: boolean;
    };
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const usersSchema = new Schema<IUser>(
    {
        name: String,
        email: String,
        phone: String,
        password: String,
        deviceCode: String,
        employeeCode: String,
        displayName: String,
        role: {
            type: String,
            default: ROLES.USER,
        },
        reportsToId: mongoose.Types.ObjectId,
        storeId: mongoose.Types.ObjectId,
        department: String,
        rawMaterialArr: [
            {
                rawMaterialId: mongoose.Types.ObjectId,
            },
        ],
        accessObj: {
            manageUsers: {
                type: Boolean,
                default: false,
            },
            manageCategory: {
                type: Boolean,
                default: false,
            },
        },
       
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const User = model<IUser>("users", usersSchema);
