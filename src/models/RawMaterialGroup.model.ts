import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IRawMaterialGroup {
    outputRawMaterialId: mongoose.Types.ObjectId;

    inputRawMaterialCategoryArr: {
        rawMaterialCategoryId: mongoose.Types.ObjectId;
        count: number;
        scrapPercentage: number;
        unit: string;
    }[];
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const rawMaterialGroupSchema = new Schema<IRawMaterialGroup>(
    {
        outputRawMaterialId: Schema.Types.ObjectId,
        inputRawMaterialCategoryArr: [{
            rawMaterialCategoryId: mongoose.Types.ObjectId,
            count: Number,
            scrapPercentage: Number,
            unit: String,
        }]
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const RawMaterialGroup = model<IRawMaterialGroup>("RawMaterialGroup", rawMaterialGroupSchema);
