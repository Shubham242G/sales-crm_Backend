import { Request, Response, NextFunction } from 'express';
// import { getInvoices, getInvoiceDetails, downloadInvoicePdf } from '../service/zohoinvoice.service';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import BillModel,{  IBill } from '@models/vendorPurchaseBill.model';

import { zohoRequest } from '../../util/zoho';
import { paginateAggregate } from '@helpers/paginateAggregate';
import mongoose, { PipelineStage } from 'mongoose';
import { deleteFileUsingUrl } from '@helpers/fileSystem';
// ----------- Controller to Sync Vendor Purchase Bills from Zoho -----------

export const syncBillModels = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const response = await zohoRequest('bills'); // Adjust endpoint if needed
        const zohoBills = response.bills || [];

        let created = 0;
        let updated = 0;

        for (const bill of zohoBills) {
            const sanitized = sanitizeZohoPurchaseBill(bill);

            const existing = await BillModel.findOne({ bill_id: sanitized.bill_id });
            if (!existing) {
                await BillModel.create(sanitized);
                created++;
            } else {
                await BillModel.updateOne({ billNumber: sanitized.bill_id }, { $set: sanitized });
                updated++;
            }
        }

        res.status(200).json({
            success: true,
            message: `${created} vendor bills created, ${updated} updated.`,
            created,
            updated,
        });
    } catch (error) {
        next(error);
    }
};

export const getVendorPurchaseBillById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await BillModel.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Vendor Bill does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Contact",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

// ----------- Controller to Get All Vendor Purchase Bills (Paginated) -----------

// const parseQueryString = (value: unknown): string | null => {
//     if (typeof value === 'string') return value.trim();
//     if (Array.isArray(value)) return value[0]?.trim() ?? null;
//     return null;
// };

// export const getAllBillModels = asyncHandler(async (req: Request, res: Response) => {
//     const matchObj: Record<string, any> = {};

//     // Handle optional search query
//     const query = parseQueryString(req.query.query);
//     if (query) {
//         matchObj.vendor_name = new RegExp(query, 'i'); // Case-insensitive search
//     }

//     // You can add more filters later if needed (example: status filter)
//     // const status = parseQueryString(req.query.status);
//     // if (status) {
//     //   matchObj.invoiceStatus = status;
//     // }

//     const bills = await BillModel.find(matchObj)
//         .sort({ createdAt: -1 }) // Newest first
//         .exec();

//     res.status(200).json({
//         success: true,
//         count: bills.length,
//         data: bills,
//     });
// });

export const getAllVendorPurchaseBills = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let pipeline: PipelineStage[] = [];
      let matchObj: Record<string, any> = {};
  
      if (req.query.query && req.query.query !== "") {
        const searchRegex = new RegExp(req.query.query as string, "i");
  
        matchObj["bill_id"] = searchRegex; 
        // 🎯 We are searching on fields that exist: vendor_name, bill_number etc.
      }
  
      if (Object.keys(matchObj).length > 0) {
        pipeline.push({ $match: matchObj });
      }
  
      const vendorPurchaseBillArr = await paginateAggregate(BillModel, pipeline, req.query);
  
      res.status(200).json({
        success: true,
        message: vendorPurchaseBillArr.total > 0 ? "Vendor Purchase Bills found." : "No Vendor Purchase Bills found.",
        data: vendorPurchaseBillArr.data,
        total: vendorPurchaseBillArr.total,
      });
    } catch (error) {
      console.error("Error in getAllVendorPurchaseBills:", error);
      next(error);
    }
  };

  export const generateVendorPurchaseBillPDF = (vendorBill: IBill): string => {
    const fileName = `Vendor Bill_${vendorBill.bill_number}.pdf`;
    const filePath = path.join(__dirname, '../../public/upload', fileName);
  
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));
  
    doc.fontSize(20).text('VENDOR PURCHASE BILL', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Vendor Bill Number: ${vendorBill.bill_number}`);
    doc.text(`Customer: ${vendorBill.vendor_name}`);
    doc.text(`Date: ${vendorBill.date}`);
    doc.text(`Status: ${vendorBill.status}`);
    doc.text(`Total: ${vendorBill.total} ${vendorBill.currency_code}`);
    doc.text(`Balance: ${vendorBill.balance} ${vendorBill.currency_code}`);
    doc.end();
  
    return `/billsById/${fileName}`; // Public URL for frontend use
  };

  export const deleteVendorPurchaseBillById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let existsCheck = await BillModel.findById(req.params.id).exec();
      if (!existsCheck) {
        throw new Error("Vendor Bill does not exists or already deleted");
      }
      await BillModel.findByIdAndDelete(req.params.id).exec();
      res.status(201).json({ message: "Vendor Purchase bill Deleted" });
    } catch (error) {
      next(error);
    }
  };

// ----------- Controller to Get a Vendor Purchase BillModel by ID -----------

// export const getBillModelById = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { id } = req.params;
//         const bill = await BillModel.findById(id);

//         if (!bill) {
//             return res.status(404).json({ success: false, message: 'Vendor Purchase BillModel not found' });
//         }

//         res.status(200).json({ success: true, data: bill });
//     } catch (error) {
//         next(error);
//     }
// };

// ----------- Helper function to sanitize Zoho Purchase BillModel Data -----------

export const sanitizeZohoPurchaseBill = (bill: any): Partial<IBill> => {
    return {
      bill_id: bill.bill_id || '',
      vendor_id: bill.vendor_id || '',
      vendor_name: bill.vendor_name || '',
      status: bill.status || '',
      color_code: bill.color_code || '',
      current_sub_status_id: bill.current_sub_status_id || '',
      current_sub_status: bill.current_sub_status || '',
      bill_number: bill.bill_number || '',
      reference_number: bill.reference_number || '',
      date: bill.date || '',
      due_date: bill.due_date || '',
      due_days: bill.due_days || '',
      currency_id: bill.currency_id || '',
      currency_code: bill.currency_code || '',
      price_precision: bill.price_precision ?? 2, // Default to 2 decimal places if not present
      exchange_rate: bill.exchange_rate ?? 1, // Default to 1 if not present
      total: bill.total ?? 0,
      tds_total: bill.tds_total ?? 0,
      balance: bill.balance ?? 0,
      unprocessed_payment_amount: bill.unprocessed_payment_amount ?? 0,
      created_time: bill.created_time || '',
      last_modified_time: bill.last_modified_time || '',
      attachment_name: bill.attachment_name || '',
      has_attachment: bill.has_attachment ?? false,
      tags: Array.isArray(bill.tags) ? bill.tags : [],
      is_uber_bill: bill.is_uber_bill ?? false,
      is_tally_bill: bill.is_tally_bill ?? false,
      cf_sales_person: bill.cf_sales_person || '',
      cf_sales_person_unformatted: bill.cf_sales_person_unformatted || '',
      cf_customer_name_branch: bill.cf_customer_name_branch || '',
      cf_customer_name_branch_unformatted: bill.cf_customer_name_branch_unformatted || '',
      cf_invoice_status: bill.cf_invoice_status || '',
      cf_invoice_status_unformatted: bill.cf_invoice_status_unformatted || '',
      entity_type: bill.entity_type || '',
      client_viewed_time: bill.client_viewed_time || '',
      is_viewed_by_client: bill.is_viewed_by_client ?? false,
      branch_id: bill.branch_id || '',
      branch_name: bill.branch_name || '',
      location_id: bill.location_id || '',
      is_bill_reconciliation_violated: bill.is_bill_reconciliation_violated ?? false,
    };
  };

// ------------ Helper to map Zoho BillModel Status to Local Status ------------
const mapZohoStatusToLocal = (status: string): 'Pending' | 'Paid' | 'Cancelled' | 'Draft' => {
    switch (status?.toLowerCase()) {
        case 'paid':
            return 'Paid';
        case 'cancelled':
            return 'Cancelled';
        case 'draft':
            return 'Draft';
        default:
            return 'Pending'; // treat all others as pending
    }
};