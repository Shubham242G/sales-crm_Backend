// File: src/v1/controllers/invoice.controller.ts

import { Request, Response, NextFunction } from 'express';
// import { getInvoices, getInvoiceDetails, downloadInvoicePdf } from '../service/zohoinvoice.service';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { IZohoInvoice, ZohoInvoice } from '@models/invoices.model';
import ExcelJs from 'exceljs';
import { zohoRequest } from '../../util/zoho';
import { paginateAggregate } from '@helpers/paginateAggregate';
import { PipelineStage } from 'mongoose';
import { ExportService } from "../../util/excelfile";

export const getAllInvoices = async (req: any, res: any, next: any) => {
  try {
    const invoices = await ZohoInvoice.find().sort({ createdAt: -1 }).exec();

    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};

    const { query } = req.query;

    if (req?.query?.advancedSearch && req.query.advancedSearch !== "") {
      const searchParams =
        typeof req.query.advancedSearch === "string"
          ? req.query.advancedSearch.split(",")
          : [];

      const advancedSearchConditions: any[] = [];

      searchParams.forEach((param: string) => {
        const [field, condition, value] = param.split(":");

        if (field && condition && value) {
          let fieldCondition: Record<string, any> = {};

          switch (condition) {
            case "contains":
              fieldCondition[field] = { $regex: value, $options: "i" };
              break;
            case "equals":
              fieldCondition[field] = value;
              break;
            case "startsWith":
              fieldCondition[field] = { $regex: `^${value}`, $options: "i" };
              break;
            case "endsWith":
              fieldCondition[field] = { $regex: `${value}$`, $options: "i" };
              break;
            case "greaterThan":
              fieldCondition[field] = {
                $gt: isNaN(Number(value)) ? value : Number(value),
              };
              break;
            case "lessThan":
              fieldCondition[field] = {
                $lt: isNaN(Number(value)) ? value : Number(value),
              };
              break;
            default:
              fieldCondition[field] = { $regex: value, $options: "i" };
          }

          advancedSearchConditions.push(fieldCondition);
        }
      });

      // If we have both basic and advanced search, we need to combine them
      if (matchObj.$or) {
        // If there are already $or conditions (from basic search)
        // We need to use $and to combine with advanced search
        matchObj = {
          $and: [{ $or: matchObj.$or }, { $and: advancedSearchConditions }],
        };
      } else {
        // If there's only advanced search, use $and directly
        matchObj.$and = advancedSearchConditions;
      }
    }

    res.status(200).json({
      success: true,
      message: "Invoice data retrieved successfully",
      data: invoices
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
    // const response = await zohoRequest('invoices');
    // const zohoInvoices = response.invoices || [];
    const response = await zohoRequest('invoices');
    const zohoInvoices = response.invoices || [];

    // Process and save all invoices
    await processAndSaveInvoices(zohoInvoices);

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

export const downloadExcelInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determine export type and adjust filename/title accordingly
  const isSelectedExport =
    req.body.tickRows &&
    Array.isArray(req.body.tickRows) &&
    req.body.tickRows.length > 0;

  return ExportService.downloadFile(req, res, next, {
    model: ZohoInvoice,
    buildQuery: buildInvoiceQuery,
    formatData: formatInvoiceData,
    processFields: processInvoiceFields,
    filename: isSelectedExport ? "selected_invoices" : "invoices",
    worksheetName: isSelectedExport ? "Selected Invoices" : "Invoices",
    title: isSelectedExport ? "Selected Invoices" : "Invoices",
  });
};

const buildInvoiceQuery = (req: Request) => {
  const query: any = {};

  // Check if specific IDs are selected (tickRows)
  if (
    req.body.tickRows &&
    Array.isArray(req.body.tickRows) &&
    req.body.tickRows.length > 0
  ) {
    // If tickRows is provided, only export selected records
    console.log("Exporting selected invoices:", req.body.tickRows.length);
    query._id = { $in: req.body.tickRows };
    return query; // Return early, ignore other filters when exporting selected rows
  }

  // If no tickRows, apply regular filters
  console.log("Exporting filtered invoices");

  if (req.body.status) {
    query.status = req.body.status;
  }

  // Date range filter
  if (req.body.dateFrom && req.body.dateTo) {
    query.date = {
      $gte: new Date(req.body.dateFrom),
      $lte: new Date(req.body.dateTo),
    };
  }

  // Created time range filter
  if (req.body.createdFrom && req.body.createdTo) {
    query.created_time = {
      $gte: new Date(req.body.createdFrom),
      $lte: new Date(req.body.createdTo),
    };
  }

  // Customer name filter
  if (req.body.customer_name) {
    query.customer_name = { $regex: req.body.customer_name, $options: "i" };
  }

  // Invoice number filter
  if (req.body.invoice_number) {
    query.invoice_number = { $regex: req.body.invoice_number, $options: "i" };
  }

  // Amount range filters
  if (req.body.totalFrom || req.body.totalTo) {
    query.total = {};
    if (req.body.totalFrom) query.total.$gte = Number(req.body.totalFrom);
    if (req.body.totalTo) query.total.$lte = Number(req.body.totalTo);
  }

  // Balance range filters
  if (req.body.balanceFrom || req.body.balanceTo) {
    query.balance = {};
    if (req.body.balanceFrom) query.balance.$gte = Number(req.body.balanceFrom);
    if (req.body.balanceTo) query.balance.$lte = Number(req.body.balanceTo);
  }

  // Currency filter
  if (req.body.currency_code) {
    query.currency_code = req.body.currency_code;
  }

  return query;
};

const formatInvoiceData = (invoice: any) => {
  return {
    id: invoice._id,
    invoice_id: invoice.invoice_id,
    invoice_number: invoice.invoice_number,
    date: invoice.date ? new Date(invoice.date).toLocaleDateString() : '',
    displayName: invoice.displayName,
    status: invoice.status,
    customer_name: invoice.customer_name,
    total: invoice.total,
    balance: invoice.balance,
    currency_code: invoice.currency_code,
    created_time: invoice.created_time ? new Date(invoice.created_time).toLocaleDateString() : '',
    updated_time: invoice.updated_time ? new Date(invoice.updated_time).toLocaleDateString() : '',
    pdf_url: invoice.pdf_url || 'N/A'
  };
};

const processInvoiceFields = (fields: string[]) => {
  const fieldMapping = {
    id: { key: "id", header: "ID", width: 15 },
    invoice_id: { key: "invoice_id", header: "Invoice ID", width: 20 },
    invoice_number: { key: "invoice_number", header: "Invoice Number", width: 20 },
    date: { key: "date", header: "Invoice Date", width: 15 },
    displayName: { key: "displayName", header: "Display Name", width: 25 },
    status: { key: "status", header: "Status", width: 15 },
    customer_name: { key: "customer_name", header: "Customer Name", width: 30 },
    total: { key: "total", header: "Total Amount", width: 15 },
    balance: { key: "balance", header: "Balance", width: 15 },
    currency_code: { key: "currency_code", header: "Currency", width: 10 },
    created_time: { key: "created_time", header: "Created Time", width: 20 },
    updated_time: { key: "updated_time", header: "Updated Time", width: 20 },
    pdf_url: { key: "pdf_url", header: "PDF URL", width: 40 }
  };

  if (fields.length === 0) {
    // Return all fields if none specified
    return Object.values(fieldMapping);
  }

  return fields
    .map((field: string) => fieldMapping[field as keyof typeof fieldMapping])
    .filter((item) => Boolean(item));
};

export const downloadInvoiceTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Invoice Template", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Define template columns
    worksheet.columns = [
      { header: "Invoice ID*", key: "invoice_id", width: 20 },
      { header: "Invoice Number*", key: "invoice_number", width: 20 },
      { header: "Date*", key: "date", width: 15 },
      { header: "Customer Name*", key: "customer_name", width: 30 },
      { header: "Total Amount*", key: "total", width: 15 },
      { header: "Balance", key: "balance", width: 15 },
      { header: "Currency Code", key: "currency_code", width: 10 },
      { header: "Status", key: "status", width: 15 },
      { header: "Display Name", key: "displayName", width: 25 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add example data
    worksheet.addRow({
      invoice_id: "INV-2023-001",
      invoice_number: "2023-001",
      date: new Date().toLocaleDateString(),
      customer_name: "Acme Corporation",
      total: 1250.50,
      balance: 1250.50,
      currency_code: "USD",
      status: "Draft",
      displayName: "January Services"
    });

    // Add dropdown validations
    // Status dropdown
    worksheet.getCell("H2").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Draft,Sent,Paid,Partially Paid,Overdue,Void"'],
    };

    // Currency dropdown (common currencies)
    worksheet.getCell("G2").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"USD,EUR,GBP,JPY,AUD,CAD,CHF,CNY"'],
    };

    // Add instructions
    const instructionSheet = workbook.addWorksheet("Instructions");
    instructionSheet.columns = [
      { header: "Field", key: "field", width: 20 },
      { header: "Description", key: "description", width: 50 },
      { header: "Required", key: "required", width: 10 },
    ];

    // Style the header row
    const instHeaderRow = instructionSheet.getRow(1);
    instHeaderRow.font = { bold: true };
    instHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add instructions
    const instructions = [
      {
        field: "Invoice ID",
        description: "Unique identifier for the invoice",
        required: "Yes",
      },
      {
        field: "Invoice Number",
        description: "Human-readable invoice number",
        required: "Yes",
      },
      {
        field: "Date",
        description: "Invoice date (MM/DD/YYYY)",
        required: "Yes",
      },
      {
        field: "Customer Name",
        description: "Name of the customer being invoiced",
        required: "Yes",
      },
      {
        field: "Total Amount",
        description: "Total amount of the invoice",
        required: "Yes",
      },
      {
        field: "Balance",
        description: "Outstanding balance",
        required: "No",
      },
      {
        field: "Currency Code",
        description: "3-letter currency code (USD, EUR, etc.)",
        required: "No",
      },
      {
        field: "Status",
        description: "Current status of the invoice",
        required: "No",
      },
      {
        field: "Display Name",
        description: "Friendly name for the invoice",
        required: "No",
      }
    ];

    instructions.forEach((instruction) => {
      instructionSheet.addRow(instruction);
    });

    // Generate file
    const timestamp = new Date().getTime();
    const filename = `invoice_import_template_${timestamp}.xlsx`;
    const directory = path.join("public", "uploads");

    // Ensure directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const filePath = path.join(directory, filename);
    await workbook.xlsx.writeFile(filePath);

    res.json({
      status: "success",
      message: "Invoice template downloaded successfully",
      filename: filename,
    });
  } catch (error) {
    console.error("Invoice template download error:", error);
    next(error);
  }
};