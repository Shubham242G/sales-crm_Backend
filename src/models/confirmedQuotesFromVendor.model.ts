import { model, Model, Schema, Types } from "mongoose";

interface IConfirmedQuotesFromVendor {
  banquetEventOrders: {
    eventCoordinatorName: string;
    eventDate: Date;
    hotelName: string;
    eventCoordinatorReportingTime: string;
    clientsCompanyName: string;
    onsiteClientName: string;
    salesPersonName: string;
    expectedPax: string;
    quotesId: string;
    rfpId: string;
    displayName: string,
    vendorList: {
        label: string,
        value: string
    }
    serviceType : [];
    amount: number;
    markupAmount: number;
    receivedDate: string;
    status: string;
    attachment: string[];
  };

  banquetEventOrdersSecond: {
    eventStartTime: string;
    eventEndTime: string;
    btr: string;
    venueHandoveTime: string;
    welcomeDrinkStartTime: string;
    venueName: string;
    setup: string;
    avVendorName: string;
    avVendorNo: string;
    expNumberOfSeating: string;
    hotelCoordinationName: string;
    hotelCoordinationNo: string;
    linerColor: string;
    startersPlacement: string;
    startersEventTime: string;
  };

  menuSelection: {
    srNo: string;
    veg: string;
    nonVeg: string;
    actions: string;
  };

  eventFlow: {
    srNo: string;
    text1: string;
    text2: string;
    actions: string;
  };

  audioVisual: {
    srNo: string;
    text1: string;
    text2: string;
    actions: string;
  };

  checklist: {
    srNo: string;
    checks: string;
    actions: string;
  }[];
    leadId: Types.ObjectId,
}
const confirmedQuotesFromVendorSchema = new Schema<IConfirmedQuotesFromVendor>(
  {
    banquetEventOrders: {
        eventCoordinatorName: String,
        eventDate: Date,
        hotelName: String,
       
        eventCoordinatorReportingTime: String,
        clientsCompanyName: String,
        onsiteClientName: String,
        salesPersonName: String,
        expectedPax: String,
        quotesId: String,
        rfpId: String,
        displayName: String,
        vendorList: {
            label: String,
            value: String
        },
         amount: Number,
    markupAmount: Number,
        serviceType: [],
        receivedDate: String,
        status: String,
        attachment: [String],
      },
    
      banquetEventOrdersSecond: {
        eventStartTime: String,
        eventEndTime: String,
        btr: String,
        venueHandoveTime: String,
        welcomeDrinkStartTime: String,
        venueName: String,
        setup: String,
        avVendorName: String,
        avVendorNo: String,
        expNumberOfSeating: String,
        hotelCoordinationName: String,
        hotelCoordinationNo: String,
        linerColor: String,
        startersPlacement: String,
        startersEventTime: String,
      },
    
      menuSelection: {
        srNo: [String],
        veg: String,
        nonVeg: String,
        actions: String,
      },
    
      eventFlow: {
        srNo: [String],
        text1: String,
        text2: String,
        actions: String,
      },
    
      audioVisual: {
        srNo: [String],
        text1: String,
        text2: String,
        actions: String,
      },
        leadId: Types.ObjectId,
    
      checklist: [
        {
          srNo: [String],
          checks: [String],
          actions: [String],
        },
      ],
  },
  { timestamps: true }
);
export const ConfirmedQuotesFromVendor = model<IConfirmedQuotesFromVendor>("confirmedQuotesFromVendor", confirmedQuotesFromVendorSchema);
