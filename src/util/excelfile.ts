import { Request, Response, NextFunction } from 'express';
import * as ExcelJs from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { Model, Document } from 'mongoose';

export interface ExportField {
  key: string;
  header: string;
  width?: number;
}

export interface ExportOptions {
  model: Model<any>;
  buildQuery: (req: Request) => any;
  formatData: (data: any) => any;
  processFields: (fields: string[]) => ExportField[];
  filename: string; // Base filename without extension
  worksheetName?: string;
  title?: string;
}

export class ExportService {
  static async downloadFile(
    req: Request,
    res: Response,
    next: NextFunction,
    options: ExportOptions
  ) {
    try {
      // Get export parameters
      const format = (req.body.format as string) || 'xlsx';
      let fields: string[] = [];

      if (req.body.fields) {
        try {
          fields = req.body.fields as string[];
        } catch (error) {
          console.error("Error parsing fields:", error);
        }
      }

      // Build query based on search parameters
      const query = options.buildQuery(req);

      // Get data from database
      const data = await options.model.find(query).lean().exec();

      // Format data
      const formattedData = data.map(options.formatData);

      // Process fields for export
      const exportFields = options.processFields(fields);

      // Generate unique filename
      const timestamp = new Date().getTime();
      const directory = path.join("public", "uploads");

      // Ensure directory exists
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      let filename = '';

      console.log("format", format);

      switch (format.toLowerCase()) {
        case 'csv':
          filename = await ExportService.exportToCsv(
            formattedData,
            exportFields,
            directory,
            timestamp,
            options.filename
          );
          break;
        case 'pdf':
          filename = await ExportService.exportToPdf(
            formattedData,
            exportFields,
            directory,
            timestamp,
            options.filename,
            options.title || options.filename
          );
          break;
        case 'xlsx':
        default:
          filename = await ExportService.exportToExcel(
            formattedData,
            exportFields,
            directory,
            timestamp,
            options.filename,
            options.worksheetName || options.filename
          );
          break;
      }

      res.json({
        status: "success",
        message: "File successfully generated",
        filename: filename,
      });

    } catch (error) {
      console.error("Export error:", error);
      next(error);
    }
  }

  private static async exportToExcel(
    data: any[],
    fields: ExportField[],
    directory: string,
    timestamp: number,
    baseName: string,
    worksheetName: string
  ): Promise<string> {
    // Create a new workbook and worksheet
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName, {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Define columns
    worksheet.columns = fields.map(field => ({
      header: field.header,
      key: field.key,
      width: field.width || 20
    }));

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    data.forEach(item => {
      const rowData: any = {};
      fields.forEach(field => {
        rowData[field.key] = item[field.key] !== undefined ? item[field.key] : '';
      });
      worksheet.addRow(rowData);
    });

    // Add borders to all cells
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Write the file
    const filename = `${baseName}_export_${timestamp}.xlsx`;
    const filePath = path.join(directory, filename);
    await workbook.xlsx.writeFile(filePath);

    return filename;
  }

  private static async exportToCsv(
    data: any[],
    fields: ExportField[],
    directory: string,
    timestamp: number,
    baseName: string
  ): Promise<string> {
    // Create CSV writer
    const filename = `${baseName}_export_${timestamp}.csv`;
    const filePath = path.join(directory, filename);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: fields.map(field => ({
        id: field.key,
        title: field.header
      }))
    });

    // Write data
    await csvWriter.writeRecords(data);

    return filename;
  }

  private static async exportToPdf(
    data: any[],
    fields: ExportField[],
    directory: string,
    timestamp: number,
    baseName: string,
    title: string
  ): Promise<string> {
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add a page
    let page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    // Define margins and spacing
    const margin = 50;
    const lineHeight = 20;
    const columnWidth = (width - margin * 2) / fields.length;

    // Draw title
    page.drawText(`${title} Export`, {
      x: margin,
      y: height - margin,
      size: 16,
      font: boldFont
    });

    // Draw export date
    const exportDate = new Date().toLocaleDateString();
    page.drawText(`Generated on: ${exportDate}`, {
      x: margin,
      y: height - margin - lineHeight,
      size: 10,
      font
    });

    // Draw header row
    let x = margin;
    let y = height - margin - lineHeight * 3;

    // Background for header
    page.drawRectangle({
      x: margin - 5,
      y: y - 5,
      width: width - margin * 2 + 10,
      height: lineHeight + 10,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Draw header text
    fields.forEach((field) => {
      page.drawText(field.header, {
        x: x + 5,
        y: y,
        size: 10,
        font: boldFont
      });
      x += columnWidth;
    });

    // Draw data rows
    y -= lineHeight + 10;

    // Limit number of rows per page
    const rowsPerPage = Math.floor((height - margin * 2 - lineHeight * 4) / lineHeight);
    let currentRow = 0;

    // Draw each data row
    for (const item of data) {
      // Check if we need a new page
      if (currentRow >= rowsPerPage) {
        // Add new page
        page = pdfDoc.addPage([842, 595]);
        page.drawText(`${title} Export (continued)`, {
          x: margin,
          y: height - margin,
          size: 16,
          font: boldFont
        });

        // Reset position for new page
        y = height - margin - lineHeight * 3;
        currentRow = 0;

        // Draw header on new page
        let headerX = margin;
        fields.forEach(field => {
          page.drawText(field.header, {
            x: headerX + 5,
            y: y,
            size: 10,
            font: boldFont
          });
          headerX += columnWidth;
        });

        y -= lineHeight + 10;
      }

      // Draw row data
      x = margin;
      fields.forEach(field => {
        const value = item[field.key] !== undefined ? String(item[field.key]) : '';

        // Truncate long values
        const maxLength = Math.floor(columnWidth / 6);
        const displayValue = value.length > maxLength ? value.substring(0, maxLength) + '...' : value;

        page.drawText(displayValue, {
          x: x + 5,
          y: y,
          size: 8,
          font
        });
        x += columnWidth;
      });

      y -= lineHeight;
      currentRow++;
    }

    // Save the PDF
    const filename = `${baseName}_export_${timestamp}.pdf`;
    const filePath = path.join(directory, filename);
    const pdfBytes = await pdfDoc.save();

    fs.writeFileSync(filePath, pdfBytes);

    return filename;
  }
}