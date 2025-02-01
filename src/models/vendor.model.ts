import { model, Model, Schema, Types } from "mongoose";

interface IVendor {
  // contactName: string;
  vendor:{
    salutation:string,
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    landLine : string;
    phoneNumber: string;
    displayName: string;
  }

    otherDetails:{
    sourceOfSupply: string;
    gstTreatment: string;
    gstin: string;
    pan: string;
    msmeRegistered: boolean;
    currency: string;
    paymentTerms: string;
    tds: string;
    priceList: string;
    enablePortal: boolean;
    portalLanguage: string;
    documents:[];
    addOtherDetails: [];
    };

    billingAddress:{
      addressId: Types.ObjectId;
      // attention : string;
      billingCountry: string;
      billingAddressStreet1: string;
      billingAddressStreet2: string;
      billingCity: string;
      billingState: string;
      billingPincode: string;
      billingPhone: string;
      billingFaxNumber:string;
    };

    shipppingAddress:{
      // attention : string;
      shippingCountry: string;
      shippingAddressStreet1: string;
      shippingAddressStreet2: string;
      shippingCity: string;
      shippingState: string;
      shippingPincode: string;
      shippingPhone: string;
      shippingFaxNumber:string;
    }
    // contactPersons
    contactPersons:{
      salutation: string;
      contactPersonId: Types.ObjectId;
      contactPersonFirstName: string;
      contactPersonLastName: string;
      contactPersonEmail: string;
      contactPersonWorkPhone: string;
      contactPersonMobile: string;
    }[];
 
  


  // companyName: string;
  // displayName: string;
  // salutation: string;
  // firstName: string;
  // lastName: string;
  
  // mobileNumber: string;
  // paymentTerms: string;
  // currencyCode: string;
  // notes: string;
  // Website: string;
  // status: string;
  // openingBalance: string;
  // branchId: string;
  // branchName: string;
  // paymentTermsLabel: string;
  // sourceOfSupply: string;
  // skypeIdentity: string;
  // department: string;
  // designation: string;

  // // social media
  // facebook: string;
  // twitter: string;

 



  // // udyam
  // msmeUdyamNo: string;
  // udyamType: string;

  // // tds
  // tdsName: string;
  // tdsPercentage: string;
  // tdsSectionCode: string;
  // tdsSection: string;
  // priceList: string;
  // contactPersonName: string;
  // // billing address
  // billingAttention: string;
  // billingAddress: string;
  // billingCity: string;
  // billingState: string;
  // billingCountry: string;
  // billingCode: string;
  // billingPhoneNumber: string;
  // alternateContact : string;
  // billingFax: string;

  // // shipping details

  // shippingAttentation: string;
  // shippingAddress: string;
  // shippingCity: string;
  // shippingState: string;
  // shippingCountry: string;
  // shippingCode: string;
  // shippingPhone: string;
  // shippingFax: string;
  // source: string;
  // lastSyncTime: string;
  // exchangeRate: string;
  // ownerName: string;
  // primaryContactId: string;
  // beneficiaryName: string;

  // // vendor details
  // vendorBankAccountNumber: string;
  // vendorBankName: string;
  // vendorIfscCode: string;

  // vendorBankCode: string;

  // //category drop down

  // // categoryId : Types.ObjectId,
  // // Array Elements
  // hotelArr: {
  //   hotelId: Types.ObjectId;
  //   roomsArr: {
  //     category: string;
  //     size: string;
  //     price: number;
  //     imagesArr: {
  //       image: string;
  //     }[];
  //   }[];
  // }[];

  // banquetArr: {
  //   category: string;
  //   banquetName: string;
  //   size: string;
  //   setup: string;
  //   vegPrice: number;
  //   nonVegPrice: number;
  //   pfa: boolean;
  //   pfaSize: string;
  //   imagesArr: {
  //     image: string;
  //   }[];
  // }[];

  // resturantArr: {
  //   foodOptions: string;
  //   noOfOccupancy: number;
  //   floor: string;
  //   isSwimimgPool: string;
  //   imagesArr: {
  //     image: string;
  //   }[];
  // }[];

  // createdAt: Date;
  // updatedAt: Date;
}

const vendorSchema = new Schema({
  // contactName: string;
  vendor:{
  salutation:String,
  firstName: String,
  lastName: String,
  email: String,
  companyName: String,
  landLine : String,
  phoneNumber: String,
  displayName: String,
  },
  otherDetails:{
  sourceOfSupply: String,
  gstTreatment: String,
  gstin: String,
  pan: String,
  msmeRegistered: Boolean,
  currency: String,
  paymentTerms: String,
  tds: String,
  priceList: String,
  enablePortal: Boolean,
  portalLanguage: String,
  documents: [],
  addOtherDetails: [],
  },

  billingAddress:{
    addressId: String,
    // attention : String,
    billingCountry: String,
    billingAddressStreet1: String,
    billingAddressStreet2: String,
    billingCity: String,
    billingState: String,
    billingPincode: String,
    billingPhone: String,
    billingFaxNumber:String,
  },

  shipppingAddress:{
  // attention : String,
  shippingCountry: String,
  shippingAddressStreet1: String,
  shippingAddressStreet2: String,
  shippingCity: String,
  shippingState: String,
  shippingPincode: String,
  shippingPhone: String,
  shippingFaxNumber:String,
  },
  // contactPersons
  contactPersons:[{
    salutation: String,
    contactPersonId: String,
    contactPersonFirstName: String,
    contactPersonLastName: String,
    contactPersonEmail: String,
    contactPersonWorkPhone: String,
    contactPersonMobile: String,
  }],
});

export const Vendor = model<IVendor>("vendor", vendorSchema);
