import { model, Model, Schema, Types } from "mongoose";

interface IConfirmedQuotesToCustomer {
  quotesId: string;
  leadId: Types.ObjectId;
  customerName: string;
  enquiryId: Types.ObjectId;
  serviceType: [];
  amount: number;
  status: string;
  displayName: string;
  markupDetails: {
    label: string;
    markupAmount: string;
  }[];
  totalMarkupAmount: string;
}

const ConfirmedQuotesToCustomerSchema = new Schema(
  {
    quotesId: String,
    leadId: Types.ObjectId,
    customerName: String,
    enquiryId: Types.ObjectId,
    serviceType: [],
    displayName: String,
    status: String,
    amount: Number,
    totalMarkupAmount: String,
    markupDetails: [
      {
        label: [String],
        markupAmount: [String],
      },
    ],
  },
  { timestamps: true }
);

export const ConfirmedQuotesToCustomer = model<IConfirmedQuotesToCustomer>(
  "ConfirmedQuotesToCustomer",
  ConfirmedQuotesToCustomerSchema
);
