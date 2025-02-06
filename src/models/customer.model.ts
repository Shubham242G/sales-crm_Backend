import { model, Model, Schema, Types } from "mongoose";


type communicationChannelsProps = {
    prefersEmail: boolean ,
    prefersSms : boolean
}

//comment

interface IContactPerson {
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    workPhone: string;
    mobilePhone: string;
    communicationChannels: communicationChannelsProps;
}


interface ICustomer {
    customerType: string;
    salutation: string;
    firstName: string;
    lastName: string;
    companyName: string;
    displayName: string;
    email: string;
    workPhone: string;
    mobile: string;
    panNumber: string;
    placeOfSupply: string;
    prefersEmail: boolean;
    prefersSms: boolean;
    gstTreatment: string;
    taxPreference: string;
    currency: string;
    paymentTerms: string;
    priceList: string;
    enablePortal: boolean;
    portalLanguage: string;
    openingBalanceState: string;
    openingBalance: string;
    creditLimit: string;
    // attention: string;
    countryRegion: string;
    addressStreet1: string;
    addressStreet2: string;
    city: string;
    state: string;
    phoneNumber: string;
    pinCode: string;
    faxNumber: string;
    // shippingAttention: string;
    shippingCountryRegion: string;
    shippingAddressStreet1: string;
    shippingAddressStreet2: string;
    shippingCity: string;
    shippingState: string;
    shippingPhoneNumber: string;
    shippingPinCode: string;
    shippingFaxNumber: string;
    contactPersons: IContactPerson[];
    documentArray: string[];
    websiteUrl: string;
    department: string;
    designation: string;
    twitter: string;
    skype: string;
    facebook: string;
    // communicationChannels: communicationChannelsProps;
}




const CustomerSchema = new Schema(
    {
        customerType: { type: String, default: "Business" },
        salutation: String,
        firstName: String,
        lastName: String,
        companyName: String,
        displayName: String,
        email: String,
        workPhone: String,
        mobile: String,
        panNumber: String,
        placeOfSupply: String,
        prefersEmail: { type: Boolean, default: false },
        prefersSms: { type: Boolean, default: false },
        gstTreatment: String,
        openingBalanceState: String,
        openingBalance: String,
        creditLimit: String,
        taxPreference: { type: String, default: "Taxable" },
        currency: String,
        paymentTerms: String,
        priceList: String,
        enablePortal: { type: Boolean, default: false },
        portalLanguage: String,
        // attention: String,
        countryRegion: String,
        addressStreet1: String,
        addressStreet2: String,
        city: String,
        state: String,
        phoneNumber: String,
        pinCode: String,
        faxNumber: String,
        // shippingAttention: String,
        shippingCountryRegion: String,
        shippingAddressStreet1: String,
        shippingAddressStreet2: String,
        shippingCity: String,
        shippingState: String,
        shippingPhoneNumber: String,
        shippingPinCode: String,
        shippingFaxNumber: String,
        contactPersons: Array,
        documentArray: Array,
        websiteUrl: String,
        department: String,
        designation: String,
        twitter: String,
        skype: String,
        facebook: String,
        // communicationChannels: Array
    },
    { timestamps: true }
);

export const Customer = model<ICustomer>("Customer", CustomerSchema);