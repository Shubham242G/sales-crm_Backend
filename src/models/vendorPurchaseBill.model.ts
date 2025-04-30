// models/Bill.model.ts
import mongoose, { Document, Schema } from 'mongoose';

/** 
 * Interface for the Bill document
 */
export interface IBill extends Document {
  bill_id: string;
  vendor_id: string;
  vendor_name: string;
  status: string;
  color_code?: string;
  current_sub_status_id?: string;
  current_sub_status?: string;
  bill_number: string;
  reference_number?: string;
  date: string; // Consider Date type if you want: `Date`
  due_date: string; // same here
  due_days?: string;
  currency_id: string;
  currency_code: string;
  price_precision: number;
  exchange_rate: number;
  total: number;
  tds_total: number;
  balance: number;
  unprocessed_payment_amount: number;
  created_time: string;
  last_modified_time: string;
  attachment_name?: string;
  has_attachment: boolean;
  tags: string[];
  is_uber_bill: boolean;
  is_tally_bill: boolean;
  cf_sales_person?: string;
  cf_sales_person_unformatted?: string;
  cf_customer_name_branch?: string;
  cf_customer_name_branch_unformatted?: string;
  cf_invoice_status?: string;
  cf_invoice_status_unformatted?: string;
  entity_type: string;
  client_viewed_time?: string;
  is_viewed_by_client: boolean;
  branch_id: string;
  branch_name: string;
  location_id: string;
  is_bill_reconciliation_violated: boolean;
}

/**
 * Bill Schema
 */
const BillSchema: Schema = new Schema(
  {
    bill_id: { type: String, required: true },
    vendor_id: { type: String, required: true },
    vendor_name: { type: String, required: true },
    status: { type: String, required: true },
    color_code: { type: String, default: '' },
    current_sub_status_id: { type: String, default: '' },
    current_sub_status: { type: String, default: '' },
    bill_number: { type: String, required: true },
    reference_number: { type: String, default: '' },
    date: { type: String, required: true },
    due_date: { type: String, required: true },
    due_days: { type: String, default: '' },
    currency_id: { type: String, required: true },
    currency_code: { type: String, required: true },
    price_precision: { type: Number, required: true },
    exchange_rate: { type: Number, required: true },
    total: { type: Number, required: true },
    tds_total: { type: Number, required: true },
    balance: { type: Number, required: true },
    unprocessed_payment_amount: { type: Number, required: true },
    created_time: { type: String, required: true },
    last_modified_time: { type: String, required: true },
    attachment_name: { type: String, default: '' },
    has_attachment: { type: Boolean, required: true },
    tags: { type: [String], default: [] },
    is_uber_bill: { type: Boolean, required: true },
    is_tally_bill: { type: Boolean, required: true },
    cf_sales_person: { type: String, default: '' },
    cf_sales_person_unformatted: { type: String, default: '' },
    cf_customer_name_branch: { type: String, default: '' },
    cf_customer_name_branch_unformatted: { type: String, default: '' },
    cf_invoice_status: { type: String, default: '' },
    cf_invoice_status_unformatted: { type: String, default: '' },
    entity_type: { type: String, required: true },
    client_viewed_time: { type: String, default: '' },
    is_viewed_by_client: { type: Boolean, required: true },
    branch_id: { type: String, required: true },
    branch_name: { type: String, required: true },
    location_id: { type: String, required: true },
    is_bill_reconciliation_violated: { type: Boolean, required: true },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

const BillModel = mongoose.model<IBill>('Bill', BillSchema);

export default BillModel;