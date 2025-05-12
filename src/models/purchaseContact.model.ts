import { model, Model, Schema, Types } from "mongoose";




interface IPurchaseContact {

    
    // Basic Details
    
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    comapny:string;
    displayName:string,
    salutation:string;
}


const PurchaseContactSchema = new Schema(
    {
        firstName: String,
    lastName: String,
    phone: String,
    email: String,
    comapny:String,
    displayName:String,
    salutation:String,


        
    },
    { timestamps: true }
);

export const PurchaseContact = model<IPurchaseContact>("PurchaseContact", PurchaseContactSchema);
