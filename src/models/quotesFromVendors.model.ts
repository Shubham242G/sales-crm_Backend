import { model, Model, Schema, Types } from "mongoose";

interface IQuotesFromVendors {
  quotesId: string;
  rfpId: string;
  enquiryId: Types.ObjectId;
  vendorList: {
    label: string;
    value: string;
  };
  serviceType: [];
  amount: string;
  receivedDate: string;
  status: string;
  attachment: string[];
  displayName: string;
  eventDates: [
    {
      startDate: Date;
    }
  ];

  markupDetails: {
    label: string;
    markupAmount: string;
  }[];
}

const QuotesFromVendorsSchema = new Schema(
  {
    quotesId: String,
    rfqId: String,
    enquiryId: Types.ObjectId,
    vendorList: {
      label: String,
      value: String,
    },
    serviceType: [],
    rfpId: String,
    amount: String,
    receivedDate: String,
    displayName: String,
    status: String,
    attachment: [String],
    eventDates: [
      {
        startDate: Date,
      },
    ],
    markupDetails: [
        {
          label: [String],
          markupAmount: [String],
        },
      ],
  },
  { timestamps: true }
);

export const QuotesFromVendors = model<IQuotesFromVendors>(
  "QuotesFromVendors",
  QuotesFromVendorsSchema
);
