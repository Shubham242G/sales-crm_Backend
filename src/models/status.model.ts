import { model, Model, Schema, Types } from "mongoose";




interface IStatus {

    
    // Basic Details
    statusId: Types.ObjectId;
    status: string;
}


const StatusSchema = new Schema(

    {
        statusId: Types.ObjectId,
        status: String,

    },
    { timestamps: true }
);

export const Status = model<IStatus>("Status", StatusSchema);
