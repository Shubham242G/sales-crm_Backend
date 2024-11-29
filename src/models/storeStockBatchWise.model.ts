import { TRANSACTION, TRANSACTION_TYPE } from "@common/constant.common";
import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IStoreStockBatchWise {
    name:string;
    userId: mongoose.Types.ObjectId;
    rawMaterialId: mongoose.Types.ObjectId;
    poId: mongoose.Types.ObjectId;
    qcId: mongoose.Types.ObjectId;
    uom:string,
    transactionType:TRANSACTION_TYPE,
    currentStock:number;
    remainingStock:number;
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const storeStockBatchWiseSchema = new Schema<IStoreStockBatchWise>(
    {
        name:String,
        userId: mongoose.Types.ObjectId,
        rawMaterialId: mongoose.Types.ObjectId,
        poId: mongoose.Types.ObjectId,
        qcId: mongoose.Types.ObjectId,
        currentStock:Number,
        remainingStock:Number,
        uom:String,
        transactionType:{type:String, default:TRANSACTION.CREDIT},
        createdAt: Date,
        updateAt: Date,
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const StoreStockBatchWise = model<IStoreStockBatchWise>("storeStockBatchWise", storeStockBatchWiseSchema);
