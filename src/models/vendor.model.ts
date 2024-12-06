import { model, Model, Schema, Types } from "mongoose";

interface IVendor {
  _id: Types.ObjectId;
  contactName: string;
  companyName: string;
  displayName: string;
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  mobileNumber: string;
  paymentTerms: string;
  currencyCode: string;
  notes: string;
  website: string;
  status: string;
  openingBalance: string;
  branchId: string;
  branchName: string;
  paymentTermsLabel: string;
  sourceOfSupply: string;
  skypeIdentity: string;
  department: string;
  designation: string;

  // social media
  facebook: string;
  twitter: string;

  // gst
  gstTreatment: string;
  gstin: string;

  // udyam
  msmeUdyamNo: string;
  udyamType: string;

  // tds
  tdsName: string;
  tdsPercentage: string;
  tdsSectionCode: string;
  tdsSection: string;
  priceList: string;

  //address
  contactAddressId: string;

  // billing address
  billingAttention: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingCode: string;
  billingPhoneNumber: string;
  billingFax: string;

  // shipping details

  shippingAttentation: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  shippingCode: string;
  shippingPhone: string;
  shippingFax: string;
  source: string;
  lastSyncTime: string;
  exchangeRate: string;
  ownerName: string;
  primaryContactId: string;
  beneficiaryName: string;

  // vendor details
  vendorBankAccountNumber: string;
  vendorBankName: string;
  vendorBankCode: string;

  //category drop down

  // categoryId : Types.ObjectId,
  // Array Elements
  hotelArr: {
    hotelId: Types.ObjectId;
    roomsArr: {
      category: string;
      size: string;
      price: number;
      imagesArr: {
        image: string;
      }[];
    }[];
  }[];

  banquetArr: {
    category: string;
    banquetName: string;
    size: string;
    setup: string;
    vegPrice: number;
    nonVegPrice: number;
    pfa: boolean;
    pfaSize: string;
    imagesArr: {
      image: string;
    }[];
  }[];

  resturantArr: {
    foodOptions: string;
    noOfOccupancy: number;
    floor: string;
    isSwimimgPool: string;
    imagesArr: {
      image: string;
    }[];
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema({
  contactName: String,
  companyName: String,
  displayName: String,
  salutation: String,
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  mobileNumber: String,
  paymentTerms: String,
  currencyCode: String,
  notes: String,
  website: String,
  status: String,
  openingBalance: String,
  branchId: String,
  branchName: String,
  paymentTermsLabel: String,
  sourceOfSupply: String,
  skypeIdentity: String,
  department: String,
  designation: String,

  // social media
  facebook: String,
  twitter: String,

  // gst
  gstTreatment: String,
  gstin: String,

  // udyam
  msmeUdyamNo: String,
  udyamType: String,

  // tds
  tdsName: String,
  tdsPercentage: String,
  tdsSectionCode: String,
  tdsSection: String,
  priceList: String,

  //address
  contactAddressId: String,

  // billing address
  billingAttention: String,
  billingAddress: String,
  billingCity: String,
  billingState: String,
  billingCountry: String,
  billingCode: String,
  billingPhoneNumber: String,
  billingFax: String,

  // shipping details

  shippingAttentation: String,
  shippingAddress: String,
  shippingCity: String,
  shippingState: String,
  shippingCountry: String,
  shippingCode: String,
  shippingPhone: String,
  shippingFax: String,
  source: String,
  lastSyncTime: String,
  exchangeRate: String,
  ownerName: String,
  primaryContactId: String,
  beneficiaryName: String,

  // vendor details
  vendorBankAccountNumber: String,
  vendorBankName: String,
  vendorBankCode: String,

  // Array Elements
  hotelArr: [
    {
      hotelId: Types.ObjectId,
      roomsArr: [
        {
          category: String,
          noOfRooms: Number,
          size: String,
          price: Number,
          imagesArr: [
            {
              image: String,
            },
          ],
        },
      ],
    },
  ],

  banquetArr: [
    {
      category: String,
      banquetName: String,
      size: String,
      setup: String,
      vegPrice: Number,
      nonVegPrice: Number,
      pfa: Boolean,
      pfaSize: String,
      imagesArr: [
        {
          image: String,
        },
      ],
    },
  ],

  resturantArr: [
    {
      foodOptions: String,
      noOfOccupancy: Number,
      floor: String,
      isSwimimgPool: String,
      imagesArr: [
        {
          image: String,
        },
      ],
    },
  ],
});

export const Vendor = model<IVendor>("vendor", vendorSchema);
