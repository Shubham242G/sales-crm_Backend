import { model, Model, Schema, Types } from "mongoose";

interface IQuotesFromVendors {
  quotesId: string;
  rfpId: string;
  rfpEnquiryId: string;
  vendorList: {
    label: string;
    value: string;
  };
  serviceType: [];
  amount: string;
  receivedDate: string;
  status: string;
  attachment: string[];
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
    rfpEnquiryId: String,
    vendorList: {
      label: String,
      value: String,
    },
    serviceType: [],
    rfpId: String,
    amount: String,
    receivedDate: String,
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
