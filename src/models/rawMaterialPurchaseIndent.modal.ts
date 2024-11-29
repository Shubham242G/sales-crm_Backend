import { GENERALSTATUS_TYPE ,GENERALSTATUS, SERIES_FOR, SERIES_FOR_TYPE} from "@common/constant.common";
import mongoose, { Schema, model } from "mongoose";
import { ISalesOrder } from "./salesOrder.model";
import { ICustomer } from "./customer.model";
import { IRawMaterials } from "./rawMaterials.model";

// 1. Create an interface representing a document in MongoDB.
export interface IRAW_MATERIAL_PURCHASE_INDENT {
    salesOrderId: mongoose.Types.ObjectId;
    salesOrderObj: ISalesOrder;
    customerId: mongoose.Types.ObjectId;
    customerObj:ICustomer;
    ppcString:string;
    ppcSequence:number;
    finalDate: Date;
    approvalPending:boolean;
    rawMaterialsArr: {
        rawMaterialObj:IRawMaterials;
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
const rawMaterialPurchaseIndentSchema = new Schema<IRAW_MATERIAL_PURCHASE_INDENT>(
    {
        salesOrderId: Schema.Types.ObjectId,
        salesOrderObj:Schema.Types.Mixed, 
        customerId: Schema.Types.ObjectId,
        customerObj:Schema.Types.Mixed, 
        ppcString:String,
        indentType:{type:String,default:SERIES_FOR.RAW_MATERIAL},
        ppcSequence:Number,
        finalDate: Date,
        approvalPending:{type:Boolean, default:true},
        status:{type:String,default:GENERALSTATUS.PENDING},
        rawMaterialsArr: [{
            rawMaterialObj:Schema.Types.Mixed, 
            rawMaterialId: mongoose.Types.ObjectId,
            count: Number,
            unit: String,
        }]
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const RawMaterialPurchaseIndent = model<IRAW_MATERIAL_PURCHASE_INDENT>("RawMaterialPurchaseIndent", rawMaterialPurchaseIndentSchema);
