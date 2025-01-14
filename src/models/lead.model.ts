import { model, Model, Schema, Types } from "mongoose";




interface ILead {



    contactType: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    panNumber: string;
    gstNumber: string;


    // displayName: string;
    // companyName: string;
    // salutation: string;
    // firstName: string;
    // lastName: string;
    // phone: string;
    // currencyCode: string;
    // notes: string;
    // website: string;
    // status: string;
    // openingBalance: string;
    // openingBalanceExchangeRate: string;
    // branchId: string;
    // branchName: string;
    // bankAccountPayment: string;
    // portalEnabled: boolean;
    // creditLimit: string;
    // customerSubType: string;
    // department: string;
    // designation: string;
    // priceList: string;
    // paymentTerms: string;
    // paymentTermsLabel: string;

    // // Contact Information
    // emailId: string;
    // mobilePhone: string;
    // skypeIdentity: string;
    // facebook: string;
    // twitter: string;

    // // GST Details
    // gstTreatment: string;
    // gstin: string;
    // taxable: boolean;
    // taxId: string;
    // taxName: string;
    // taxPercentage: string;
    // exemptionReason: string;

    // // Billing Address
    // billingAttention: string;
    // billingAddress: string;
    // billingStreet2: string;
    // billingCity: string;
    // billingState: string;
    // billingCountry: string;
    // billingCounty: string;
    // billingCode: string;
    // billingPhone: string;
    // billingFax: string;

    // // Shipping Address
    // shippingAttention: string;
    // shippingAddress: string;
    // shippingStreet2: string;
    // shippingCity: string;
    // shippingState: string;
    // shippingCountry: string;
    // shippingCounty: string;
    // shippingCode: string;
    // shippingPhone: string;
    // shippingFax: string;

    // // Additional Details
    // placeOfContact: string;
    // placeOfContactWithStateCode: string;
    // contactAddressId: string;
    // source: string;
    // ownerName: string;
    // primaryContactId: string;
    // contactId: string;
    // contactName: string;
    // contactType: string;
    // lastSyncTime: string;
}


const LeadSchema = new Schema(
    {


        contactType: String,
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        company: String,
        panNumber: String,
        gstNumber: String,





    },
    { timestamps: true }
);

export const Lead = model<ILead>("Lead", LeadSchema);
