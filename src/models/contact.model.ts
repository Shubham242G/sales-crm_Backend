import { model, Model, Schema, Types } from "mongoose";




interface IContact {

    
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    typeOfContact: string;
    salutaton:string;
    // Basic Details

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


const ContactSchema = new Schema(
    {
        firstName: String,
        lastName: String,
        phone: String,
        email: String,
        salutaton: String,


        // Basic Details
        // displayName: String,
        // companyName: String,
        // salutation: String,
        // firstName: String,
        // lastName: String,
        // phone: String,
        // currencyCode: String,
        // notes: String,
        // website: String,
        // status: String,
        // openingBalance: String,
        // openingBalanceExchangeRate: String,
        // branchId: String,
        // branchName: String,
        // bankAccountPayment: String,
        // portalEnabled: { type: Boolean, default: false },
        // creditLimit: String,
        // customerSubType: String,
        // department: String,
        // designation: String,
        // priceList: String,
        // paymentTerms: String,
        // paymentTermsLabel: String,

        // // Contact Information
        // emailId: String,
        // mobilePhone: String,
        // skypeIdentity: String,
        // facebook: String,
        // twitter: String,

        // // GST Details
        // gstTreatment: String,
        // gstin: String,
        // taxable: { type: Boolean, default: false },
        // taxId: String,
        // taxName: String,
        // taxPercentage: String,
        // exemptionReason: String,

        // // Billing Address
        // billingAttention: String,
        // billingAddress: String,
        // billingStreet2: String,
        // billingCity: String,
        // billingState: String,
        // billingCountry: String,
        // billingCounty: String,
        // billingCode: String,
        // billingPhone: String,
        // billingFax: String,

        // // Shipping Address
        // shippingAttention: String,
        // shippingAddress: String,
        // shippingStreet2: String,
        // shippingCity: String,
        // shippingState: String,
        // shippingCountry: String,
        // shippingCounty: String,
        // shippingCode: String,
        // shippingPhone: String,
        // shippingFax: String,

        // // Additional Details
        // placeOfContact: String,
        // placeOfContactWithStateCode: String,
        // contactAddressId: String,
        // source: String,
        // ownerName: String,
        // primaryContactId: String,
        // contactId: String,
        // contactName: String,
        // contactType: String,
        // lastSyncTime: String,
    },
    { timestamps: true }
);

export const Contact = model<IContact>("Contact", ContactSchema);
