import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IStoreStock {
    name:string;
    userId: mongoose.Types.ObjectId;
    rawmaterialId: mongoose.Types.ObjectId;
    uom:string,
    stock:number;
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const storeStockSchema = new Schema<IStoreStock>(
    {
        name:String,
        userId: mongoose.Types.ObjectId,
        rawmaterialId: mongoose.Types.ObjectId,
        uom:String,
        stock:Number,
        createdAt: Date,
        updateAt: Date,
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const StoreStock = model<IStoreStock>("storeStock", storeStockSchema);
