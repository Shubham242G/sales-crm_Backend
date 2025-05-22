import mongoose, { Schema, Types, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface INotification {
    userId: Types.ObjectId | string;
    title: string;
    message: string;
    leadId?: Types.ObjectId;
}

// 2. Create a Schema corresponding to the document interface.
const notificationSchema = new Schema<INotification>(
    {
        userId: Types.ObjectId,
        title: String,
        message: String,
        leadId: Types.ObjectId
      },
    { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema);
