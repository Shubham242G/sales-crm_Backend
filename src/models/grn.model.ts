import { GENERALSTATUS } from "@common/constant.common";
import mongoose, { Schema, model } from "mongoose";
import { IRawMaterials } from "./rawMaterials.model";
import { IRAW_MATERIAL_PURCHASE_INDENT } from "./rawMaterialPurchaseIndent.modal";
import { ISalesOrder } from "./salesOrder.model";
import { IPurchaseOrder } from "./purchaseOrder.model";

// 1. Create an interface representing a document in MongoDB.
export interface IGRN {
    grnNo: string;
    poId: mongoose.Types.ObjectId;
    poObj: IPurchaseOrder;
    salesOrderObj: ISalesOrder;
    indentObj: IRAW_MATERIAL_PURCHASE_INDENT;
    salesOrderId: mongoose.Types.ObjectId;
    indentId: mongoose.Types.ObjectId;
    poNo: string;
    invoiceNo: string;
    grnDate: Date;
    invoiceDate: Date;
    supplier: string;
    rawMaterialsArr: {
        productNo: string;
        rawMaterialId: mongoose.Types.ObjectId;
        rawMaterialObj: IRawMaterials;
        productName: string;
        uom: string;
        specification: string;
        invoiceQuantity: number;
        receivedQuantity: number;
        qualityStatus: string;
    }[];
    remark: string;
    status: string;
    storeIncharge: string;
    relatedDepartment: string;
    departmentHead: string;
    managinghead: string;
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const grnSchema = new Schema<IGRN>(
    {
        grnNo: String,
        poId: mongoose.Types.ObjectId,
        salesOrderId: mongoose.Types.ObjectId,
        indentId: mongoose.Types.ObjectId,
        poObj: Schema.Types.Mixed,
        salesOrderObj: Schema.Types.Mixed,
        indentObj: Schema.Types.Mixed,
        poNo: String,
        invoiceNo: String,
        grnDate: Date,
        invoiceDate: Date,
        supplier: String,
        status: { type: String, default: GENERALSTATUS.QCPENDING },
        rawMaterialsArr: [
            {
                productNo: String,
                itemName: String,
                rawMaterialId: mongoose.Types.ObjectId,
                rawMaterialObj: Schema.Types.Mixed,
                specification: String,
                uom: String,
                invoiceQuantity: Number,
                receivedQuantity: Number,
                qualityStatus: String,
            },
        ],
        remark: String,
        storeIncharge: String,
        relatedDepartment: String,
        departmentHead: String,
        managinghead: String,
    },
    { timestamps: true }
);

export const Grn = model<IGRN>("Grns", grnSchema);
