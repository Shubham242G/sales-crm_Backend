
import { model, Model, Schema, Types } from "mongoose";




interface IRpf {


    name: string;
    phone: string;
    email: string;
    typeOfContact: string;

    contactId: string;
    subject: string;
    details: string;
    priority: string;



}




const RpfSchema = new Schema({
    name: String,
    phone: String,
    email: String,
    typeOfContact: String,
    contactId: {
        type: Schema.Types.ObjectId,
        ref: 'Contact', // Reference to the Contact model
    },
    subject: String,
    details: String,
    priority: { type: String, default: 'Normal' },


    //     // Basic Details
    //     // displayName: String,
    //     // companyName: String,
    //     // salutation: String,
    //     // firstName: String,
    //     // lastName: String,
    //     // phone: String,
    //     // currencyCode: String,
    //     // notes: String,
    //     // website: String,
    //     // status: String,
    //     // openingBalance: String,
    //     // openingBalanceExchangeRate: String,
    //     // branchId: String,
    //     // branchName: String,
    //     // bankAccountPayment: String,
    //     // portalEnabled: { type: Boolean, default: false },
    //     // creditLimit: String,
    //     // customerSubType: String,
    //     // department: String,
    //     // designation: String,
    //     // priceList: String,
    //     // paymentTerms: String,
    //     // paymentTermsLabel: String,

    //     // // Contact Information
    //     // emailId: String,
    //     // mobilePhone: String,
    //     // skypeIdentity: String,
    //     // facebook: String,
    //     // twitter: String,

    //     // // GST Details
    //     // gstTreatment: String,
    //     // gstin: String,
    //     // taxable: { type: Boolean, default: false },
    //     // taxId: String,
    //     // taxName: String,
    //     // taxPercentage: String,
    //     // exemptionReason: String,

    //     // // Billing Address
    //     // billingAttention: String,
    //     // billingAddress: String,
    //     // billingStreet2: String,
    //     // billingCity: String,
    //     // billingState: String,
    //     // billingCountry: String,
    //     // billingCounty: String,
    //     // billingCode: String,
    //     // billingPhone: String,
    //     // billingFax: String,

    //     // // Shipping Address
    //     // shippingAttention: String,
    //     // shippingAddress: String,
    //     // shippingStreet2: String,
    //     // shippingCity: String,
    //     // shippingState: String,
    //     // shippingCountry: String,
    //     // shippingCounty: String,
    //     // shippingCode: String,
    //     // shippingPhone: String,
    //     // shippingFax: String,

    //     // // Additional Details
    //     // placeOfContact: String,
    //     // placeOfContactWithStateCode: String,
    //     // contactAddressId: String,
    //     // source: String,
    //     // ownerName: String,
    //     // primaryContactId: String,
    //     // contactId: String,
    //     // contactName: String,
    //     // contactType: String,
    //     // lastSyncTime: String,
},
    { timestamps: true }
);

export const Rpf = model<IRpf>("Rpf", RpfSchema);
