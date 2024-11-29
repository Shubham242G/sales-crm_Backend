import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IBOM {
    productId: mongoose.Types.ObjectId;
    // scrapPercentage: number;
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const bomSchema = new Schema<IBOM>(
    {
        productId: Schema.Types.ObjectId,
        // scrapPercentage: Number,
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const Bom = model<IBOM>("Boms", bomSchema);
