import { model, Model, Schema, Types } from "mongoose";


interface IDepartmentMaster {
    subDepartment: string;
    department: string;
    createdAt: Date;
    updateAt: Date;
};


const DepartmentMasterSchema = new Schema({
    subDepartment: String,
    department: String,

}, { timestamps: true })

export const DepartmentMaster  = model<IDepartmentMaster>("DepartmentMaster", DepartmentMasterSchema);
