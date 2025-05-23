import { model, Model, Schema, Types } from "mongoose";




interface ILead {


    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    displayName:string;
    leadOwner: string;
   


    
}


const LeadSchema = new Schema(
    {

        salutation: String,
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        company: String,
        displayName: String,
        leadOwner: String,




    },
    { timestamps: true }
);

export const Lead = model<ILead>("Lead", LeadSchema);
