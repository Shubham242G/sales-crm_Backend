import { model, Model, Schema, Types } from "mongoose";



interface IMarkUpDetails {
  label: string;
  orignalAmount
  : number;
  markupAmount: number;
}
interface IQuotesFromVendors {
  quotesId: string;
  rfpId: string;
  enquiryId?: Types.ObjectId;
  leadId: Types.ObjectId;
  vendorList: {
    label: string;
    value: string;
  };
  serviceType: [];
  amount: Number;
  receivedDate: string;
  status: string;
  attachment: string[];
  displayName: string;
  eventDates: [
    {
      startDate: Date;
    }
  ];

  markupDetails: IMarkUpDetails[];
  totalMarkupAmount?: number;
}

const QuotesFromVendorsSchema = new Schema(
  {
    quotesId: String,
    rfqId: String,
    enquiryId: Types.ObjectId,
    leadId: Types.ObjectId,
    vendorList: {
      label: String,
      value: String,
    },
    serviceType: [],
    rfpId: String,
    amount: Number,
    receivedDate: String,
    displayName: String,
    status: String,
    attachment: [String],
    totalAmount: String,
    eventDates: [
      {
        startDate: Date,
      },
    ],
    markupDetails: [{
      label: String,
      orignalAmount: Number,
      markupAmount: Number,
    }],
    totalMarkupAmount: Number,
  },
  { timestamps: true }
);

export const QuotesFromVendors = model<IQuotesFromVendors>(
  "QuotesFromVendors",
  QuotesFromVendorsSchema
);
