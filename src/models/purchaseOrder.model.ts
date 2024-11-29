import { GENERALSTATUS, GENERALSTATUS_TYPE } from "@common/constant.common";
import mongoose, { Schema, model } from "mongoose";
import { IRawMaterials } from "./rawMaterials.model";
import { IRAW_MATERIAL_PURCHASE_INDENT } from "./rawMaterialPurchaseIndent.modal";
import { ISalesOrder } from "./salesOrder.model";
import { ICustomer } from "./customer.model";

// 1. Create an interface representing a document in MongoDB.
export interface IPurchaseOrder {
    _id: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    salesOrderId: mongoose.Types.ObjectId;
    customerObj:ICustomer;
    saleslOrderObj:ISalesOrder;
    rawMaterialPurchaseIndentObj:IRAW_MATERIAL_PURCHASE_INDENT;
    purchaseOrderNo: string;
    indentNo: string;
    indentId:  mongoose.Types.ObjectId;
    quotationNo: string;
    purchaseOrderDate: Date;
    rawMaterialsArr: {
        rawMaterialId: mongoose.Types.ObjectId;
        rawMaterialObj: IRawMaterials;
        quantity: number;
        unitRate: number;
        uom: string;
        totalAmount: number;
    }[];
    filesArr: {
        fileUrl:string,
    }[];
    basicTotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    roundOff: number;
    totalAmount: number;
    deliveryDate: Date;
    paymentTerms: string;
    freight: string;
    modeOfDispatch: string;
    dispatchArrangement: string;
    methodOfProductApproval: string;
    insurance: string;
    dispatchDestination: string;
    note: string;
    issuedby: string;
    issuedbyDate: Date;
    verifiedby: string;
    verifiedbyDate: Date;
    approvedby: string;
    approvedbyDate: Date;
    distribution: string;
    retentionPeriod: string;
    effectiveDate: Date;
    revNo: number;
    revDate: Date;
    approvalPending:boolean;
    status:GENERALSTATUS_TYPE;
    createdAt: Date;
    updateAt: Date;
}


// 2. Create a Schema corresponding to the document interface.
const purchaseOrderSchema = new Schema<IPurchaseOrder>(
    {
        customerId: mongoose.Types.ObjectId,
        indentId: mongoose.Types.ObjectId,
        salesOrderId: mongoose.Types.ObjectId,
        purchaseOrderNo: String,
        indentNo: String,
        quotationNo: String,
        purchaseOrderDate: Date,
        customerObj:Schema.Types.Mixed,
        saleslOrderObj:Schema.Types.Mixed,
        rawMaterialPurchaseIndentObj:Schema.Types.Mixed,
    
        rawMaterialsArr: [
            {
                rawMaterialId: mongoose.Types.ObjectId,
                rawMaterialObj:Schema.Types.Mixed,
                quantity: Number,
                unitRate: Number,
                uom: String,
                totalAmount: Number,
            },
        ],
        filesArr: [{
            fileUrl:String,
        }],
        approvalPending:{type:Boolean, default:true},
        status:{type:String,default:GENERALSTATUS.PENDING},
        basicTotal: Number,
        cgst: Number,
        sgst: Number,
        igst: Number,
        roundOff: Number,
        totalAmount: Number,
        deliveryDate: Date,
        paymentTerms: String,
        freight: String,
        modeOfDispatch: String,
        dispatchArrangement: String,
        methodOfProductApproval: String,
        insurance: String,
        dispatchDestination: String,
        note: String,
        issuedby: String,
        issuedbyDate: Date,

        verifiedby: String,
        verifiedbyDate: Date,

        approvedby: String,
        approvedbyDate: Date,

        distribution: String,
        retentionPeriod: String,
        effectiveDate: Date,
        revNo: Number,
        revDate: Date,
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const PurchaseOrder = model<IPurchaseOrder>(
    "PurchaseOrder",
    purchaseOrderSchema
);
