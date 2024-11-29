import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IProformaInvoice {
    customerId: mongoose.Types.ObjectId;
    billingAddress:string,
    deliveryAddress:string,
    timeOfPreperation:string,
    invoiceNumber:string,
    invoiceDate:Date,
    piRefNo:string,
    productsArr: {
        productId: mongoose.Types.ObjectId;
        hsnNo:string,
        noOfPellets:number,
        uom: string;
        unitRate: number; //////perkg
        typeOfTax:string,
        rateOfTax:string,
        quantity: number;
        totalAmount: number;
    }[];
    basicTotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    roundOff: number;
    insurance:string;
    totalAmount: number;
    modeOfTransport:string;
    vehicleNumber:string;
    nameOfTransporter:string;
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const proformaInvoiceSchema = new Schema<IProformaInvoice>(
    {
        customerId: mongoose.Types.ObjectId,
        billingAddress:String,
        deliveryAddress:String,
        timeOfPreperation:String,
        invoiceNumber:String,
        invoiceDate:Date,
        piRefNo:String,
        productsArr: [{
            productId: mongoose.Types.ObjectId,
            hsnNo:String,
            noOfPellets:Number,
            uom: String,
            unitRate: Number, //////perkg
            typeOfTax:String,
            rateOfTax:String,
            quantity: Number,
            totalAmount: Number,
        }],
        basicTotal: Number,
        cgst: Number,
        sgst: Number,
        igst: Number,
        roundOff: Number,
        insurance:String,
        totalAmount: Number,
        modeOfTransport:String,
        vehicleNumber:String,
        nameOfTransporter:String,
    },
    { timestamps: true }
);

export const ProformaInvoice = model<IProformaInvoice>("ProformaInvoice",proformaInvoiceSchema);