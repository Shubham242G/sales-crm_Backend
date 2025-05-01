import { model, Model, Schema, Types } from "mongoose";

interface IQuotesToCustomer {
  quotesId: string;
  customerName: string;
  enquiryId: Types.ObjectId;
  serviceType: [];
  amount: number;
  status: string;
  markupDetails: {
    label: string;
    markupAmount: string;
  }[];
  totalAmount: string;
}

const QuotesFromVendorsSchema = new Schema(
  {
    quotesId: String,
    customerName: String,
    enquiryId: Types.ObjectId,
    serviceType: [],
    status: String,
    amount: Number,
    totalAmount: String,
    markupDetails: [
      {
        label: [String],
        markupAmount: [String],
      },
    ],
  },
  { timestamps: true }
);

export const QuotesToCustomer = model<IQuotesToCustomer>(
  "QuotesToCustomer",
  QuotesFromVendorsSchema
);
