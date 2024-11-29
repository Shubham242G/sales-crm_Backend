import { Schema, Types, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface Ipolicy {
    _id: Types.ObjectId;
    name: string;
    description: string;
    activeStatus: boolean;
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const policySchema = new Schema<Ipolicy>(
    {
        name: String,
        description: String,
        activeStatus: Boolean,
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const Policy = model<Ipolicy>("policies", policySchema);
