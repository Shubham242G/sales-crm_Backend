import { GENERALSTATUS_TYPE ,GENERALSTATUS, SERIES_FOR, SERIES_FOR_TYPE} from "@common/constant.common";
import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IRAW_MATERIAL_PRODUCTION_INDENT {
    salesOrderId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    ppcString:string;
    ppcSequence:number;
    finalDate: Date;
    approvalPending:boolean;
    rawMaterialsArr: {
        rawMaterialId: mongoose.Types.ObjectId;
        count: number;
        unit: string;
    }[];
    indentType:SERIES_FOR_TYPE,
    status:GENERALSTATUS_TYPE,
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const rawMaterialProductionIndentSchema = new Schema<IRAW_MATERIAL_PRODUCTION_INDENT>(
    {
        salesOrderId: Schema.Types.ObjectId,
        customerId: Schema.Types.ObjectId,
        ppcString:String,
        indentType:{type:String,default:SERIES_FOR.RAW_MATERIAL},
        ppcSequence:Number,
        finalDate: Date,
        approvalPending:{type:Boolean, default:true},
        status:{type:String,default:GENERALSTATUS.PENDING},
        rawMaterialsArr: [{
            rawMaterialId: mongoose.Types.ObjectId,
            count: Number,
            unit: String,
        }]
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const RawMaterialProductionIndent = model<IRAW_MATERIAL_PRODUCTION_INDENT>("RawMaterialProductionIndent", rawMaterialProductionIndentSchema);
