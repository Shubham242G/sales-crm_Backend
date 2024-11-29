import mongoose, { Schema, model } from "mongoose";
import { IRawMaterials } from "./rawMaterials.model";
import { ISalesOrder } from "./salesOrder.model";
import { IGRN } from "./grn.model";
import { ICustomer } from "./customer.model";
import { IRAW_MATERIAL_PURCHASE_INDENT } from "./rawMaterialPurchaseIndent.modal";
import { IPurchaseOrder } from "./purchaseOrder.model";

// 1. Create an interface representing a document in MongoDB.
export interface IRawMaterialQc {
    salesOrderId: mongoose.Types.ObjectId;
    grnId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    indentId: mongoose.Types.ObjectId;
    poId: mongoose.Types.ObjectId;

    salesOrderObj: ISalesOrder;
    grnObj: IGRN;
    customerObj: ICustomer;
    indent: IRAW_MATERIAL_PURCHASE_INDENT;
    poObj: IPurchaseOrder;

    finalDate: Date;
    rawMaterialsArr: {
        rawMaterialId: mongoose.Types.ObjectId;
        rawMaterialObj: IRawMaterials;
        quantity: number;
        okQuantity: number;
        rejectedQuantity: number;
        holdQuantity: number;
        rejectReason: string;
        holdReason: string;
        unit: string;
        parametersArr: {
            name: string;
            value: number;
            unit: string;
            realised: number;
        }[];
    }[];
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const rawMaterialQcSchema = new Schema<IRawMaterialQc>(
    {
        salesOrderId: Schema.Types.ObjectId,
        grnId: Schema.Types.ObjectId,
        indentId: Schema.Types.ObjectId,
        poId: Schema.Types.ObjectId,
        customerId: Schema.Types.ObjectId,

        salesOrderObj: Schema.Types.Mixed,
        grnObj: Schema.Types.Mixed,
        customerObj: Schema.Types.Mixed,
        indent: Schema.Types.Mixed,
        poObj: Schema.Types.Mixed,

        finalDate: Date,
        rawMaterialsArr: [
            {
                rawMaterialId: mongoose.Types.ObjectId,
                rawMaterialObj: Schema.Types.Mixed,
                quantity: Number,
                okQuantity: Number,
                rejectedQuantity: Number,
                holdQuantity: Number,
                rejectReason: String,
                holdReason: String,
                unit: String,
                parametersArr: [
                    {
                        name: String,
                        value: String,
                        unit: String,
                        realised: String,
                    },
                ],
            },
        ],
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const RawMaterialQc = model<IRawMaterialQc>("RawMaterialQc", rawMaterialQcSchema);
