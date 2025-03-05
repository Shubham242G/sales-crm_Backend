import { model, Model, Schema, Types } from "mongoose";

interface IQuotesToCustomer {
  quotesId: string;
  customerName: string;
  serviceType: [];
  amount: string;
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
    serviceType: [],
    amount: String,
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
