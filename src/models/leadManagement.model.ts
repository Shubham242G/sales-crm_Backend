 import { model, Model, Schema, Types } from "mongoose";




interface ILeadManagement {


   userId : Types.ObjectId;
   leadIds : Types.ObjectId[];
    
   


    
}


const LeadManagementSchema = new Schema(
    {

       userId: { type: Schema.Types.ObjectId, ref: "User" },
       leadIds: [{ type: Schema.Types.ObjectId, ref: "Lead" }],




    },
    { timestamps: true }
);

export const LeadManagement = model<ILeadManagement>("LeadManagement", LeadManagementSchema);