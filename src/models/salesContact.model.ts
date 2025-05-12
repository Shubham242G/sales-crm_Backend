import { model, Model, Schema, Types } from "mongoose";




interface ISalesContact {

    
    // Basic Details
    leadId: Types.ObjectId;
    firstName: string;
    lastName: string;
    phone: string;
    displayName: string;
    email: string;
    company:string;
    salutation:string;
    vendorId?: Types.ObjectId;
    state: string;
    city: string;
    area: string;
    phoneNumber: string;
}


const SalesContactSchema = new Schema(

    {
        leadId: {type:Types.ObjectId, ref: "Lead"},
        firstName: String,
        lastName: String,
        phone: String,
        email: String,
        displayName: String,
        company:String,
        salutation:String,
        vendorId: {type:Types.ObjectId, ref: "Vendor"},
        state: String,
        city: String,
        area: String,
        phoneNumber: String

    },
    { timestamps: true }
);

export const SalesContact = model<ISalesContact>("Sales Contact", SalesContactSchema);
