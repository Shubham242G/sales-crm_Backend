import { model, Model, Schema, Types } from "mongoose";




interface ICustomer {






    contactName: "",
    contactOwner: "",
    companyName: "",
    email: "",
    phoneNumber: "",
    panNumber: "",
    placeOfSupply: "",
    state: "",
    city: "",
    Area: "",
    Address: "",
    bankName: "",
    bankAccountNumber: "",
    bankIFSCCode: "",
    salutation: "",

    contactPersonName: "",
    contactPersonEmail: "",
    constactPersonPhoneNumber: "",



}


const CustomerSchema = new Schema(
    {




        contactOwner: String,
        companyName: String,
        email: String,
        contactName: String,
        phoneNumber: String,
        panNumber: String,
        placeOfSupply: String,
        state: String,
        city: String,
        Area: String,
        Address: String,
        bankName: String,
        bankAccountNumber: String,
        bankIFSCCode: String,
        salutation: String,

        contactPersonName: String,
        contactPersonEmail: String,
        constactPersonPhoneNumber: String,









    },
    { timestamps: true }
);

export const Customer = model<ICustomer>("Customer", CustomerSchema);
