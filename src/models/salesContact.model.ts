import { model, Model, Schema, Types } from "mongoose";




interface ISalesContact {

    
    // Basic Details
    leadId: Types.ObjectId;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    company:string;
    salutation:string;
    
}


const SalesContactSchema = new Schema(

    {
        leadId: {type:Types.ObjectId, ref: "Lead"},
        firstName: String,
        lastName: String,
        phone: String,
        email: String,
        company:String,
        salutation:String,

    },
    { timestamps: true }
);

export const SalesContact = model<ISalesContact>("Contact", SalesContactSchema);
