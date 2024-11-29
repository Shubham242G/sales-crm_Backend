import { GENERALSTATUS, GENERALSTATUS_TYPE, RAW_MATERIAL_REQUEST, RAW_MATERIAL_REQUEST_TYPES } from "@common/constant.common";
import { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IRawMaterialRequest {

    storeId: Schema.Types.ObjectId,
    requestedBy: Schema.Types.ObjectId,
    rawMaterialId: Schema.Types.ObjectId,
    quantity: Number;
    rawMaterialApprovedArr: {
        rawMaterialId: Schema.Types.ObjectId,
        quantity: Number;
    }[],
    approvedOrDenyDate?:Date;
    status:RAW_MATERIAL_REQUEST_TYPES| string;
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const rawMaterialRequestSchema = new Schema<IRawMaterialRequest>(
    {
        storeId: Schema.Types.ObjectId,
        requestedBy: Schema.Types.ObjectId,
        quantity: Number,
        rawMaterialId:Schema.Types.ObjectId,
        rawMaterialApprovedArr: [{
            rawMaterialId:Schema.Types.ObjectId,
            quantity:Number,

        }],
        status:{type:String,default:RAW_MATERIAL_REQUEST.PENDING},
        approvedOrDenyDate:Date
        
        // And `Schema.Types.ObjectId` in the schema definition.
    },
{ timestamps: true }
);

export const RawMaterialRequest = model<IRawMaterialRequest>(
    "RawMaterialRequest",
    rawMaterialRequestSchema
);
