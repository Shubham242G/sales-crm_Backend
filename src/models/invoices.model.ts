// File: src/models/invoices.model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IZohoInvoice extends Document {
  invoice_id: string;
  invoice_number: string;
  date: string;
  status: string;
  customer_name: string;
  total: number;
  balance: number;
  currency_code: string;
  created_time: Date;
  updated_time: Date;
  pdf_url?: string;
  // Add more fields as needed
}

const ZohoInvoiceSchema: Schema = new Schema(
  {
    invoice_id: { type: String, required: true, unique: true },
    invoice_number: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, required: true },
    customer_name: { type: String, required: true },
    total: { type: Number, required: true },
    balance: { type: Number, required: true },
    currency_code: { type: String, required: true },
    pdf_url: { type: String },
    // You can add more fields based on Zoho's response structure
  },
  {
    timestamps: true,
    strict: false // Allow storing additional fields from Zoho
  }
);

export const ZohoInvoice = mongoose.model<IZohoInvoice>('ZohoInvoice', ZohoInvoiceSchema);


// File: src/v1/routes/invoice.routes.ts

