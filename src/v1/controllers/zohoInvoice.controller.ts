// File: src/v1/controllers/invoice.controller.ts

import { Request, Response, NextFunction } from 'express';
// import { getInvoices, getInvoiceDetails, downloadInvoicePdf } from '../service/zohoinvoice.service';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { IZohoInvoice, ZohoInvoice } from '@models/invoices.model';

import { zohoRequest } from '../../util/zoho';
import { paginateAggregate } from '@helpers/paginateAggregate';
import { PipelineStage } from 'mongoose';

export const getAllInvoices = async (req: any, res: any, next: any) => {
  try {
    // Get zoho data first
    const response = await zohoRequest('invoices');
    const zohoInvoices = response.invoices || [];

    // Process and save all invoices
    await processAndSaveInvoices(zohoInvoices);

    // Create pipeline for fetching from database with filters
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};

    // Add search filter if query parameter exists
    if (req.query.query && req.query.query !== "") {
      matchObj.$or = [
        { customer_name: new RegExp(req.query.query, "i") },
        { invoice_number: new RegExp(req.query.query, "i") }
      ];
    }

    // Add status filter if provided
    if (req.query.status && req.query.status !== "") {
      matchObj.status = req.query.status;
      console.log("Status filter applied:", req.query.status);
    }

    // Add date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      matchObj.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    pipeline.push({
      $match: matchObj
    });

    // Sort by date if requested
    if (req.query.sortBy === "date") {
      pipeline.push({
        $sort: { date: req.query.sortOrder === "desc" ? -1 : 1 }
      });
    }

    // Use the same pagination utility as the banquet controller
    let invoicesArr = await paginateAggregate(ZohoInvoice, pipeline, req.query);

    res.status(200).json({
      message: "Invoice data retrieved successfully",
      data: invoicesArr.data,
      total: invoicesArr.total
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required"
      });
    }

    // Find the invoice by ID
    const invoice = await ZohoInvoice.findOne({ invoice_id: id });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    // If you need to fetch fresh data from Zoho for this invoice
    // you could add that logic here

    res.status(200).json({
      success: true,
      message: "Invoice details retrieved successfully",
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to process and save invoices
const processAndSaveInvoices = async (zohoInvoices: any[]) => {
  const createdCount = 0;
  const updatedCount = 0;

  for (const invoice of zohoInvoices) {
    const sanitizedInvoice: any = {
      invoice_id: invoice.invoice_id,
      invoice_number: invoice.invoice_number,
      date: invoice.date,
      status: invoice.status,
      customer_name: invoice.customer_name || invoice.customer?.customer_name || 'Unknown',
      total: invoice.total,
      balance: invoice.balance,
      currency_code: invoice.currency_code,
      pdf_url: invoice.pdf_url || '',
      created_time: new Date(invoice.created_time),
      updated_time: new Date(invoice.last_modified_time),
    };

    // Upsert operation - creates if not exists, updates if exists
    await ZohoInvoice.updateOne(
      { invoice_id: invoice.invoice_id },
      { $set: sanitizedInvoice },
      { upsert: true }
    );
  }
};

// If you still want to sync invoices and return counts separately
export const syncInvoices = async (req: any, res: any, next: any) => {
  try {
    const response = await zohoRequest('invoices');
    const zohoInvoices = response.invoices || [];

    const createdInvoices = [];
    const updatedInvoices = [];

    for (const invoice of zohoInvoices) {
      const existing = await ZohoInvoice.findOne({ invoice_id: invoice.invoice_id });

      const sanitizedInvoice: any = {
        invoice_id: invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        date: invoice.date,
        status: invoice.status,
        customer_name: invoice.customer_name || invoice.customer?.customer_name || 'Unknown',
        total: invoice.total,
        balance: invoice.balance,
        currency_code: invoice.currency_code,
        pdf_url: invoice.pdf_url || '',
        created_time: new Date(invoice.created_time),
        updated_time: new Date(invoice.last_modified_time),
      };

      if (!existing) {
        const created = await ZohoInvoice.create(sanitizedInvoice);
        createdInvoices.push(created);
      } else {
        const updated = await ZohoInvoice.findOneAndUpdate(
          { invoice_id: invoice.invoice_id },
          { $set: sanitizedInvoice },
          { new: true }
        );
        updatedInvoices.push(updated);
      }
    }

    res.status(200).json({
      success: true,
      message: `${createdInvoices.length} invoices created, ${updatedInvoices.length} updated.`,
      createdCount: createdInvoices.length,
      updatedCount: updatedInvoices.length,
    });
  } catch (error) {
    next(error);
  }
};

export const generateInvoicePDF = (invoice: IZohoInvoice): string => {
  const fileName = `Invoice_${invoice.invoice_number}.pdf`;
  const filePath = path.join(__dirname, '../../public/upload', fileName);

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text('INVOICE', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice Number: ${invoice.invoice_number}`);
  doc.text(`Customer: ${invoice.customer_name}`);
  doc.text(`Date: ${invoice.date}`);
  doc.text(`Status: ${invoice.status}`);
  doc.text(`Total: ${invoice.total} ${invoice.currency_code}`);
  doc.text(`Balance: ${invoice.balance} ${invoice.currency_code}`);
  doc.end();

  return `/invoices/${fileName}`; // Public URL for frontend use
};