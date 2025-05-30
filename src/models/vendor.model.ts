import { model, Model, Schema, Types } from "mongoose";

export interface IVendor {
  vendor: {
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    contactName: string;
    contactOwner: string;
  
    panNumber: string;
    gst: string;
    vendorType: string[];
    landLine: string;
    phoneNumber: string;
    displayName: string;
  };
  isBanquetDetailsVisible: boolean;
  isRestaurantDetailsVisible: boolean;

  location: {
    state: string;
    city: string;
    area: string;
    address: string;
  };

  category: {
    categoryType: string;
  };

  rooms: {
    roomCategory: string;
    numberOfRooms: number;
    roomSize: string;
    roomImageUpload: string[];
    prices: {
      roomType: string;
      roomPrice: string;
    }[];
  }[];

  banquets: {
    numberOfBanquests: string;
    banquetCategory: string;
    banquetSize: string;
    banquetImageUpload: string[];
    banquetName: string;
    banquetSetup: string;
    banquetVegPrice: string;
    banquetNonVegPrice: string;
    banquetLocation: string;
    banquetFloor: string;
    prefuntionAreaSize: string;
  }[];

  restaurant: {
    restaurantMenuType: string[];
    restaurantImageUpload: string[];
    restaurantCovers: string;
    restaurantFloor: string;
    restaurantSwimmingPool: string;
  };

  bankDetails: {
    bankName: string;
    bankAccountNumber: string;
    ifsc: string;
    pointOfContact: string;
    email: string;
    phoneNumber: string;
    billingAddress: string;
  };

  eventServices: {
    services: string;
    rate: string;
  }[];

  eventLocation: {
    state: string;
    city: string;
    area: string;
    serviceAreas: string[];
  };

  transportLocation: {
    state: string;
    city: string;
    travelLocal: boolean;
    travelOutStation: boolean;
    serviceAreas: string[];
    carDetails: {
      carType: string;
      numberOfCars: number;
      fourHr40Km: string;
      eightHr80Km: string;
      fullDay100Km: string;
      airportTransfer: string;
    }[];
  };

  otherDetails: {
    sourceOfSupply: string;
    gstTreatment: string;
    gstin: string;
    pan: string;
    msmeRegistered: boolean;
    currency: string;
    openingBalanceState: string;
    openingBalance: string;
    creditLimit: string;
    paymentTerms: string;
    tds: string;
    priceList: string;
    enablePortal: boolean;
    portalLanguage: string;
    documents: string[];
    websiteUrl: string;
    department: string;
    designation: string;
    twitter: string;
    facebook: string;
    skype: string;
  };

  billingAddress: {
    addressId: Types.ObjectId;
    billingCountry: string;
    billingAddressStreet1: string;
    billingAddressStreet2: string;
    billingCity: string;
    billingState: string;
    billingPincode: string;
    billingPhone: string;
    billingFaxNumber: string;
  };

  shippingAddress: {
    shippingCountry: string;
    shippingAddressStreet1: string;
    shippingAddressStreet2: string;
    shippingCity: string;
    shippingState: string;
    shippingPincode: string;
    shippingPhone: string;
    shippingFaxNumber: string;
  };

  contactPersons: {
    salutation: string;
    contactPersonId: Types.ObjectId;
    contactPersonFirstName: string;
    contactPersonLastName: string;
    contactPersonEmail: string;
    contactPersonWorkPhone: string;
    contactPersonMobilePhone: string;
    contactPersonMobile: string;
    contactPersonDateOfBirth: string;
    contactPersonAnniversary: string;
    contactPersonDesignation: string;
    contactPersonDepartment: string;
  }[];
}

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


// {
//   contact_id: '916798000010469063',
//   contact_name: 'AKBAR TRAVELS OF INDIA PVT. LTD',
//   vendor_name: 'AKBAR TRAVELS OF INDIA PVT. LTD',
//   company_name: 'AKBAR TRAVELS OF INDIA PVT. LTD',
//   website: '',
//   language_code: 'en',
//   language_code_formatted: 'English',
//   contact_type: 'vendor',
//   contact_type_formatted: 'Vendors',
//   status: 'active',
//   customer_sub_type: 'business',
//   source: 'user',
//   is_linked_with_zohocrm: false,
//   payment_terms: 0,
//   payment_terms_label: 'Due On Receipt',
//   currency_id: '916798000000000099',
//   twitter: '',
//   facebook: '',
//   currency_code: 'INR',
//   outstanding_payable_amount: 0,
//   outstanding_payable_amount_bcy: 0,
//   unused_credits_payable_amount: 0,
//   unused_credits_payable_amount_bcy: 0,
//   first_name: '',
//   last_name: '',
//   email: '',
//   phone: '',
//   mobile: '',
//   portal_status: 'disabled',
//   portal_status_formatted: 'Disabled',
//   created_time: '2022-08-06T15:45:55+0530',
//   created_time_formatted: '06/08/2022',
//   last_modified_time: '2024-06-25T09:50:07+0530',
//   last_modified_time_formatted: '25/06/2024',
//   custom_fields: [],
//   custom_field_hash: {},
//   tags: [],
//   ach_supported: false,
//   gst_no: '27AADCA2140D1ZC',
//   gst_treatment: 'business_gst',
//   place_of_contact: 'MH',
//   place_of_contact_formatted: 'Maharashtra',
//   has_attachment: false,
//   pan_no: 'AADCA2140D'
// }

const vendorSchema = new Schema<IVendor>({
  vendor: {
    salutation: String,
    firstName: String,
    lastName: String,
    email: String,
    companyName: String,
    contactName: String,
    contactOwner: String,
    panNumber: String,
    gst: String,
    vendorType: [String],
    landLine: String,
    phoneNumber: String,
    displayName: String,

  },
  isBanquetDetailsVisible: Boolean,
  isRestaurantDetailsVisible: Boolean,
  otherDetails: {
    sourceOfSupply: String,
    gstTreatment: String,
    gstin: String,
    pan: String,
    msmeRegistered: Boolean,
    currency: String,
    openingBalanceState: String,
    openingBalance: String,
    creditLimit: String,
    paymentTerms: String,
    tds: String,
    priceList: String,
    enablePortal: Boolean,
    portalLanguage: String,
    documents: [String],
    websiteUrl: String,
    facebook: String,
    twitter: String,
    skype: String,
    department: String,
    designation: String,
  },
  location: {
    state: String,
    city: String,
    area: String,
    address: String,
  },
  category: {
    categoryType: String,
  },
  rooms: [{
    roomCategory: String,
    numberOfRooms: Number,
    roomSize: String,
    roomImageUpload: [String],
    prices: [{
      roomType: String,
      roomPrice: String,
    }],
  }],
  banquets: [{
    numberOfBanquests: String,
    banquetCategory: String,
    banquetSize: String,
    banquetImageUpload: [String],
    banquetName: String,
    banquetSetup: String,
    banquetVegPrice: String,
    banquetNonVegPrice: String,
    banquetFloor: String,
    prefuntionAreaSize: String,
  }],
  restaurant: {
    restaurantMenuType: [String],
    restaurantImageUpload: [String],
    restaurantCovers: String,
    restaurantFloor: String,
    restaurantSwimmingPool: String,
  },
  bankDetails: {
    bankName: String,
    bankAccountNumber: String,
    ifsc: String,
    pointOfContact: String,
    email: String,
    phoneNumber: String,
    billingAddress: String,
  },

  eventServices: [{
    services: String,
    rate: String,
  }],

  eventLocation: {
    state: String,
    city: String,
    area: String,
    serviceAreas: [String],
  },

  transportLocation: {
    state: String,
    city: String,
    travelLocal: Boolean,
    travelOutStation: Boolean,
    serviceAreas: [String],
    carDetails: [
      {
        carType: String,
        numberOfCars: Number,
        fourHr40Km: String,
        eightHr80Km: String,
        fullDay100Km: String,
        airportTransfer: String,
      },
    ],
  },

  billingAddress: {
    addressId: String,
    billingCountry: String,
    billingAddressStreet1: String,
    billingAddressStreet2: String,
    billingCity: String,
    billingState: String,
    billingPincode: String,
    billingPhone: String,
    billingFaxNumber: String,
  },
  shippingAddress: {
    shippingCountry: String,
    shippingAddressStreet1: String,
    shippingAddressStreet2: String,
    shippingCity: String,
    shippingState: String,
    shippingPincode: String,
    shippingPhone: String,
    shippingFaxNumber: String,
  },
  contactPersons: [{
    salutation: String,
    contactPersonId: Schema.Types.ObjectId,
    contactPersonFirstName: String,
    contactPersonLastName: String,
    contactPersonEmail: String,
    contactPersonWorkPhone: String,
    contactPersonMobilePhone: String,
    contactPersonMobile: String,
    contactPersonDateOfBirth: String,
    contactPersonAnniversary: String,
    contactPersonDesignation: String,
    contactPersonDepartment: String,
  }],
}, { timestamps: true });
export const Vendor = model<IVendor>("vendor", vendorSchema);
