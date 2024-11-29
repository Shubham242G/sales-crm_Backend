import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IVendors {
    name: string;
    safeCoCode: string;
    cgst: number;
    sgst: number;
    igst: number;
    paymentTerms: string;
    freight: string;
    modeOfDispatch: string;
    dispatchArrangement: string;
    methodOfProductApproval: string;
    insurance: string;
    dispatchDestination: string;
    note: string;
    distribution: string;
    retentionPeriod: string;
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const VendorsSchema = new Schema<IVendors>(
    {
        name: String,
        safeCoCode: String,
        cgst: Number,
        sgst: Number,
        igst: Number,
        paymentTerms: String,
        freight: String,
        modeOfDispatch: String,
        dispatchArrangement: String,
        methodOfProductApproval: String,
        insurance: String,
        dispatchDestination: String,
        note: String,
        distribution: String,
        retentionPeriod: String,
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const Vendors = model<IVendors>("vendors", VendorsSchema);