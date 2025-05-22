import { model, Model, Schema, Types } from "mongoose";


interface IDepartmentMaster {
    subDepartment: string;
    department: string;
    leadId: Types.ObjectId;
    createdAt: Date;
    updateAt: Date;
};


const DepartmentMasterSchema = new Schema({
    subDepartment: String,
    leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    department: String,

}, { timestamps: true })

export const DepartmentMaster  = model<IDepartmentMaster>("DepartmentMaster", DepartmentMasterSchema);
