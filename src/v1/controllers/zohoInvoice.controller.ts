// File: src/v1/controllers/invoice.controller.ts

import { Request, Response, NextFunction } from 'express';
// import { getInvoices, getInvoiceDetails, downloadInvoicePdf } from '../service/zohoinvoice.service';
// import {}
import { ZohoInvoice } from '@models/invoices.model';
import path from 'path';

// export const listInvoices = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { from_date, to_date, status } = req.query as { 
//       from_date?: string;
//       to_date?: string;
//       status?: string;
//     };
    
//     const result = await getInvoices(from_date, to_date, status);
//     res.json(result);
//   } catch (error) {
//     next(error);
//   }
// };

// export const getInvoice = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { id } = req.params;
//     const result = await getInvoiceDetails(id);
//     res.json(result);
//   } catch (error) {
//     next(error);
//   }
// };

// export const downloadInvoice = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { id } = req.params;
//     const invoiceFilePath = await downloadInvoicePdf(id);
    
//     // Update invoice in database with PDF URL
//     const pdfUrl = `/downloads/invoices/invoice-${id}.pdf`;
//     await ZohoInvoice.findOneAndUpdate(
//       { invoice_id: id },
//       { pdf_url: pdfUrl },
//       { new: true }
//     );
    
//     res.download(invoiceFilePath, `invoice-${id}.pdf`);
//   } catch (error) {
//     next(error);
//   }
// };


// export const getInvoices = async (req: Request, res: Response) => {
//   try {
//     const { from, to } = req.query;

//     let dateFilter;
//     if (from && to) {
//       dateFilter = {
//         from: from as string,
//         to: to as string,
//       };
//     }

//     const data = await fetchInvoicesFromZoho(dateFilter);
//     return res.status(200).json({ success: true, invoices: data.invoices || [], total: data.page_context?.total || 0 });
//   } catch (error: any) {
//     console.error("❌ Error fetching invoices:", error?.response?.data || error.message);
//     return res.status(500).json({ success: false, message: "Failed to fetch invoices", error: error.message });
//   }
// };