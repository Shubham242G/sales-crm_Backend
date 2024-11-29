import mongoose, { Schema, Types, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface ILog {
    requestType: string;
    previousData?: Schema.Types.Mixed;
    changeObj?: Schema.Types.Mixed;
    requestPayload?: Schema.Types.Mixed;
    createdByName: string;
    createdById: mongoose.Types.ObjectId;
    createdByRole: string;
    message:string,
}

// 2. Create a Schema corresponding to the document interface.
const logSchema = new Schema<ILog>(
    {
        requestType: String,
        previousData: Schema.Types.Mixed,
        changeObj: Schema.Types.Mixed,
        requestPayload: Schema.Types.Mixed,
        createdByName: String,
        createdById: mongoose.Types.ObjectId,
        createdByRole: String,
        message:String,
      },
    { timestamps: true }
);

export const Log = model<ILog>("Logs", logSchema);
