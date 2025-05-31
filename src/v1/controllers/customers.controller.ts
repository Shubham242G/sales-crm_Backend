import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Contact } from '@models/contact.model';
import { zohoRequest } from '../../util/zoho'; // Ensure this fetches customers from Zoho
import { PipelineStage } from 'mongoose';
import { paginateAggregate } from '@helpers/paginateAggregate';
import { storeFileAndReturnNameBase64 } from '@helpers/fileSystem';
import { ExportService } from '../../util/excelfile';
import fs from "fs";
import XLSX from "xlsx";
import path from "path";
import ExcelJs from "exceljs";





export const addCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Banquet.findOne({ name: req.body.name }).exec();
        // if (existsCheck) {
        //     throw new Error("Banquet with same name already exists");
        // }
        // if (req?.body?.documentArray && req?.body?.documentArray?.length > 0 && req?.body?.documentArray?.includes("base64"))  {

        //     for (let el of req?.body?.documentArray) {
        //         if (el && el !== "") {
        //             console.log(el, "before conversion");
        //             el = await storeFileAndReturnNameBase64(el);

        //         }

        //     }
        // }

        console.log(req.body, "req body inside add customer")

        if (req?.body?.documentArray?.length > 0) {
            req.body.documentArray = await Promise.all(
                req.body.documentArray.map(async (el: any) => {
                    if (el && el.includes("base64")) {
                        return await storeFileAndReturnNameBase64(el);
                    }
                    return el; // Return the same value if no update is needed
                })
            );
        }


        const customer = await new Contact(req.body).save();
        res.status(201).json({ message: "Customer Created" });


    } catch (error) {
        next(error);
    }
};

export const updateCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {

        let existsCheck = await Contact.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Customer does not exists");
        }



        // if (req?.body?.documentArray && req?.body?.documentArray?.length > 0 ) {

        //     console.log(req.body.documentArray, "check the document array inside include statement ")
        //     for (let el of req.body.documentArray) {
        //         if (el && el !== "" && el.includes("base64")) {
        //             console.log("el check for store", el)
        //             el = await storeFileAndReturnNameBase64(el);
        //             console.log("el check after store", el)
        //         }
        //     }
        // }

        if (req?.body?.documentArray?.length > 0) {
            req.body.documentArray = await Promise.all(
                req.body.documentArray.map(async (el: any) => {
                    if (el && el.includes("base64")) {
                        return await storeFileAndReturnNameBase64(el);
                    }
                    return el; // Return the same value if no update is needed
                })
            );
        }


        let Obj = await Contact.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Customer Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Contact.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Customer does not exists or already deleted");
        }
        await Contact.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Customer Deleted" });
    } catch (error) {
        next(error);
    }
};



// export const getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         // Sync customers first (optional, you can move this to a separate sync endpoint)
//         const response = await zohoRequest('contacts'); // Adjust endpoint if needed


//         console.log(response, response.customers, "response from zoho=======> customer");
//         const zohoCustomers = response.customers || [];

//         await processAndSaveCustomers(zohoCustomers);

//         // Build aggregation pipeline
//         let match: Record<string, any> = {};
//         const pipeline: PipelineStage[] = [];

//         if (req.query.query) {
//             match.$or = [
//                 { displayName: new RegExp(req.query.query as string, 'i') },
//                 { email: new RegExp(req.query.query as string, 'i') }
//             ];
//         }

//         if (req.query.country) {
//             match.countryRegion = req.query.country;
//         }

//         pipeline.push({ $match: match });

//         if (req.query.sortBy === 'createdAt') {
//             pipeline.push({ $sort: { createdAt: req.query.sortOrder === 'desc' ? -1 : 1 } });
//         }

//         const customersArr = await paginateAggregate(Contact, pipeline, req.query);

//         res.status(200).json({
//             success: true,
//             message: 'Customers retrieved successfully',
//             data: customersArr.data,
//             total: customersArr.total
//         });

//         console.log("Customers retrieved successfully======>", customersArr.data);
//     } catch (error) {
//         next(error);
//     }
// };


export const getAllCustomers = async (req: any, res: any, next: any) => {

    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};

        const { query } = req.query;
        // Handle basic search - search across multiple fields
        if (
          req.query.query &&
          typeof req.query.query === "string" &&
          req.query.query !== ""
        ) {
          matchObj.$or = [
            {
              firstName: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            {
              lastName: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            {
              email: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            {
              company: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            {
              phone: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            {
              ownerName: new RegExp(
                typeof req?.query?.query === "string" ? req.query.query : "",
                "i"
              ),
            },
            // Add any other fields you want to search by
          ];
        }
    
        // Handle advanced search (same as before)
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
    
        if (req?.query?.isForSelectInput) {
            pipeline.push({
              $project: {
                label: { $concat: ["$firstName", " ", "$lastName"] },
                value: "$_id",
              },
            });
          }
        // Add the match stage to the pipeline
        pipeline.push({
          $match: matchObj,
        });
        let CustomerArr = await paginateAggregate(Contact, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: CustomerArr.data, total: CustomerArr.total });
    } catch (error) {
        next(error);
    }
};


export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const customer = await Contact.findById(id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

export const syncCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const response = await zohoRequest('contacts');
        const zohoCustomers = response.customers || [];

        let created = 0;
        let updated = 0;

        for (const cust of zohoCustomers) {
            const sanitized = sanitizeZohoCustomer(cust);

            const existing = await Contact.findOne({ email: sanitized.email });
            if (!existing) {
                await Contact.create(sanitized);
                created++;
            } else {
                await Contact.updateOne({ email: sanitized.email }, { $set: sanitized });
                updated++;
            }
        }

        res.status(200).json({
            success: true,
            message: `${created} customers created, ${updated} updated.`,
            created,
            updated,
        });
    } catch (error) {
        next(error);
    }
};

// Helper for saving Zoho customers
// const processAndSaveCustomers = async (customers: any[]) => {
//     for (const cust of customers) {
//         const sanitized = sanitizeZohoCustomer(cust);
//         await Customer.updateOne({ email: sanitized.email }, { $set: sanitized }, { upsert: true });
//     }
// };

// Zoho to Mongo field mapping
const sanitizeZohoCustomer = (cust: any) => ({
    customerType: cust.customer_type || 'Business',
    salutation: cust.salutation || '',
    firstName: cust.first_name || '',
    lastName: cust.last_name || '',
    companyName: cust.company_name || '',
    displayName: cust.display_name || '',
    email: cust.email || '',
    workPhone: cust.phone || '',
    mobile: cust.mobile || '',
    panNumber: cust.pan_no || '',
    placeOfSupply: cust.place_of_supply || '',
    prefersEmail: cust.prefered_email || false,
    prefersSms: cust.prefered_sms || false,
    gstTreatment: cust.gst_treatment || '',
    taxPreference: cust.tax_type || 'Taxable',
    currency: cust.currency_code || '',
    paymentTerms: cust.payment_terms || '',
    priceList: cust.price_list_id || '',
    enablePortal: cust.portal_status === 'active',
    portalLanguage: cust.language_code || 'en',
    openingBalanceState: cust.opening_balance_type || '',
    openingBalance: cust.opening_balance || '0',
    creditLimit: cust.credit_limit || '0',
    countryRegion: cust.billing_address?.country || '',
    addressStreet1: cust.billing_address?.address || '',
    addressStreet2: '',
    city: cust.billing_address?.city || '',
    state: cust.billing_address?.state || '',
    phoneNumber: cust.phone || '',
    pinCode: cust.billing_address?.zip || '',
    faxNumber: cust.billing_address?.fax || '',
    shippingCountryRegion: cust.shipping_address?.country || '',
    shippingAddressStreet1: cust.shipping_address?.address || '',
    shippingAddressStreet2: '',
    shippingCity: cust.shipping_address?.city || '',
    shippingState: cust.shipping_address?.state || '',
    shippingPhoneNumber: cust.shipping_address?.phone || '',
    shippingPinCode: cust.shipping_address?.zip || '',
    shippingFaxNumber: cust.shipping_address?.fax || '',
    contactPersons: cust.contact_persons || [],
    documentArray: [],
    websiteUrl: cust.website || '',
    department: cust.department || '',
    designation: cust.designation || '',
    twitter: '',
    skype: '',
    facebook: ''
});



const processAndSaveCustomers = async (customers: any[]) => {
    const createdCount = 0;
    const updatedCount = 0;

    for (const cust of customers) {
        const sanitizedCustomer: any = {
            customerType: cust.customer_type || 'Business',
            salutation: cust.salutation || '',
            firstName: cust.first_name || '',
            lastName: cust.last_name || '',
            companyName: cust.company_name || '',
            displayName: cust.display_name || '',
            email: cust.email || '',
            workPhone: cust.phone || '',
            mobile: cust.mobile || '',
            panNumber: cust.pan_no || '',
            placeOfSupply: cust.place_of_supply || '',
            prefersEmail: cust.prefered_email || false,
            prefersSms: cust.prefered_sms || false,
            gstTreatment: cust.gst_treatment || '',
            taxPreference: cust.tax_type || 'Taxable',
            currency: cust.currency_code || '',
            paymentTerms: cust.payment_terms || '',
            priceList: cust.price_list_id || '',
            enablePortal: cust.portal_status === 'active',
            portalLanguage: cust.language_code || 'en',
            openingBalanceState: cust.opening_balance_type || '',
            openingBalance: cust.opening_balance || '0',
            creditLimit: cust.credit_limit || '0',
            countryRegion: cust.billing_address?.country || '',
            addressStreet1: cust.billing_address?.address || '',
            addressStreet2: '',
            city: cust.billing_address?.city || '',
            state: cust.billing_address?.state || '',
            phoneNumber: cust.phone || '',
            pinCode: cust.billing_address?.zip || '',
            faxNumber: cust.billing_address?.fax || '',
            shippingCountryRegion: cust.shipping_address?.country || '',
            shippingAddressStreet1: cust.shipping_address?.address || '',
            shippingAddressStreet2: '',
            shippingCity: cust.shipping_address?.city || '',
            shippingState: cust.shipping_address?.state || '',
            shippingPhoneNumber: cust.shipping_address?.phone || '',
            shippingPinCode: cust.shipping_address?.zip || '',
            shippingFaxNumber: cust.shipping_address?.fax || '',
            contactPersons: cust.contact_persons || [],
            documentArray: [],
            websiteUrl: cust.website || '',
            department: cust.department || '',
            designation: cust.designation || '',
            twitter: '',
            skype: '',
            facebook: ''
        };

        // Upsert operation - creates if not exists, updates if exists
        await Contact.updateOne(
            { email: cust.email },
            { $set: sanitizedCustomer },
            { upsert: true }
        );



    }
};

export const downloadExcelContact = async (
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
    model: Contact,
    buildQuery: buildQuery, // This function now handles both scenarios
    formatData: formatContactData,
    processFields: processFields,
    filename: isSelectedExport ? "selected_contacts" : "contacts",
    worksheetName: isSelectedExport ? "Selected Contacts" : "Contacts",
    title: isSelectedExport ? "Selected Contacts" : "Contacts",
  });
};

const buildQuery = (req: Request) => {
  const query: any = {};

  // Check if specific IDs are selected (tickRows)
  if (
    req.body.tickRows &&
    Array.isArray(req.body.tickRows) &&
    req.body.tickRows.length > 0
  ) {
    // If tickRows is provided, only export selected records
    console.log("Exporting selected rows:", req.body.tickRows.length);
    query._id = { $in: req.body.tickRows };
    return query; // Return early, ignore other filters when exporting selected rows
  }

  // If no tickRows, apply regular filters
  console.log("Exporting filtered records");

  if (req.body.status) {
    query.status = req.body.status;
  }

  if (req.body.dateFrom && req.body.dateTo) {
    query.createdAt = {
      $gte: new Date(req.body.dateFrom),
      $lte: new Date(req.body.dateTo),
    };
  }

  // Add other existing filters here
  if (req.body.source) {
    query.source = req.body.source;
  }

  if (req.body.assignedTo) {
    query.assignedTo = req.body.assignedTo;
  }

  // Add search functionality if needed
  if (req.body.search) {
    query.$or = [
      { name: { $regex: req.body.search, $options: "i" } },
      { email: { $regex: req.body.search, $options: "i" } },
      { phone: { $regex: req.body.search, $options: "i" } },
    ];
  }

  return query;
};

const formatContactData = (contact: any) => {
//   console.log(lead, "check lead vlaue in lead controller");

//   console.log(lead.firstName, "check firstName");
  return {
    id: contact._id,
    customerType: contact.customerType,
    salutation: contact.salutation,
    firstName: contact.firstName,
    lastName: contact.lastName,
    companyName: contact.companyName,
    displayName: contact.displayName,
    email: contact.email,
    workPhone: contact.workPhone,
    phone: contact.phone,
    mobile: contact.phoneNumber, // Assuming phoneNumber is the mobile field
    panNumber: contact.panNumber,
    placeOfSupply: contact.placeOfSupply,
    prefersEmail: contact.prefersEmail,
    prefersSms: contact.prefersSms,
    gstTreatment: contact.gstTreatment,
    taxPreference: contact.taxPreference,
    currency: contact.currency,
    paymentTerms: contact.paymentTerms,
    priceList: contact.priceList,
    enablePortal: contact.enablePortal,
    portalLanguage: contact.portalLanguage,
    openingBalanceState: contact.openingBalanceState,
    openingBalance: contact.openingBalance,
    creditLimit: contact.creditLimit,
    countryRegion: contact.countryRegion,
    addressStreet1: contact.addressStreet1,
    addressStreet2: contact.addressStreet2,
    city: contact.city,
    state: contact.state,
    pinCode: contact.pinCode,
    faxNumber: contact.faxNumber,
    shippingCountryRegion: contact.shippingCountryRegion,
    shippingAddressStreet1: contact.shippingAddressStreet1,
    shippingAddressStreet2: contact.shippingAddressStreet2,
    shippingCity: contact.shippingCity,
    shippingState: contact.shippingState,
    shippingPhoneNumber: contact.shippingPhoneNumber,
    shippingPinCode: contact.shippingPinCode,
    shippingFaxNumber: contact.shippingFaxNumber,
    websiteUrl: contact.websiteUrl,
    department: contact.department,
    designation: contact.designation,
    twitter: contact.twitter,
    skype: contact.skype,
    facebook: contact.facebook,
    leadId: contact.leadId,
    contactPersons: contact.contactPersons?.map((person:any) => ({
      salutation: person.salutation,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      workPhone: person.workPhone,
      phone: person.phone,
      prefersEmail: person.communicationChannels?.prefersEmail,
      prefersSms: person.communicationChannels?.prefersSms,
      dateOfBirth: person.contactPersonDateOfBirth,
      anniversary: person.contactPersonAnniversary,
      designation: person.contactPersonDesignation,
      department: person.contactPersonDepartment,
      leadId: person.leadId
    })),
    documentArray: contact.documentArray,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt 
      ? new Date(contact.updatedAt).toLocaleDateString()
      : ""
  };
};

const processFields = (fields: string[]) => {
    const fieldMapping = {
      id: { key: "id", header: "ID", width: 15 },
      customerType: { key: "customerType", header: "Customer Type", width: 20 },
      salutation: { key: "salutation", header: "Salutation", width: 15 },
      firstName: { key: "firstName", header: "First Name", width: 25 },
      lastName: { key: "lastName", header: "Last Name", width: 25 },
      companyName: { key: "companyName", header: "Company Name", width: 30 },
      displayName: { key: "displayName", header: "Display Name", width: 25 },
      email: { key: "email", header: "Email", width: 30 },
      workPhone: { key: "workPhone", header: "Work Phone", width: 20 },
      phone: { key: "phone", header: "Phone", width: 20 },
      mobile: { key: "mobile", header: "Mobile", width: 20 },
      panNumber: { key: "panNumber", header: "PAN Number", width: 20 },
      placeOfSupply: { key: "placeOfSupply", header: "Place of Supply", width: 25 },
      prefersEmail: { key: "prefersEmail", header: "Prefers Email", width: 15 },
      prefersSms: { key: "prefersSms", header: "Prefers SMS", width: 15 },
      gstTreatment: { key: "gstTreatment", header: "GST Treatment", width: 20 },
      taxPreference: { key: "taxPreference", header: "Tax Preference", width: 20 },
      currency: { key: "currency", header: "Currency", width: 15 },
      paymentTerms: { key: "paymentTerms", header: "Payment Terms", width: 20 },
      priceList: { key: "priceList", header: "Price List", width: 20 },
      enablePortal: { key: "enablePortal", header: "Enable Portal", width: 15 },
      portalLanguage: { key: "portalLanguage", header: "Portal Language", width: 20 },
      openingBalanceState: { key: "openingBalanceState", header: "Opening Balance State", width: 25 },
      openingBalance: { key: "openingBalance", header: "Opening Balance", width: 20 },
      creditLimit: { key: "creditLimit", header: "Credit Limit", width: 20 },
      countryRegion: { key: "countryRegion", header: "Country/Region", width: 20 },
      addressStreet1: { key: "addressStreet1", header: "Address Street 1", width: 30 },
      addressStreet2: { key: "addressStreet2", header: "Address Street 2", width: 30 },
      city: { key: "city", header: "City", width: 20 },
      state: { key: "state", header: "State", width: 20 },
      pinCode: { key: "pinCode", header: "PIN Code", width: 15 },
      faxNumber: { key: "faxNumber", header: "Fax Number", width: 20 },
      shippingCountryRegion: { key: "shippingCountryRegion", header: "Shipping Country/Region", width: 25 },
      shippingAddressStreet1: { key: "shippingAddressStreet1", header: "Shipping Address Street 1", width: 35 },
      shippingAddressStreet2: { key: "shippingAddressStreet2", header: "Shipping Address Street 2", width: 35 },
      shippingCity: { key: "shippingCity", header: "Shipping City", width: 20 },
      shippingState: { key: "shippingState", header: "Shipping State", width: 20 },
      shippingPhoneNumber: { key: "shippingPhoneNumber", header: "Shipping Phone", width: 20 },
      shippingPinCode: { key: "shippingPinCode", header: "Shipping PIN Code", width: 20 },
      shippingFaxNumber: { key: "shippingFaxNumber", header: "Shipping Fax", width: 20 },
      websiteUrl: { key: "websiteUrl", header: "Website URL", width: 30 },
      department: { key: "department", header: "Department", width: 20 },
      designation: { key: "designation", header: "Designation", width: 20 },
      twitter: { key: "twitter", header: "Twitter", width: 20 },
      skype: { key: "skype", header: "Skype", width: 20 },
      facebook: { key: "facebook", header: "Facebook", width: 20 },
      leadId: { key: "leadId", header: "Lead ID", width: 25 },
      contactPersons: { key: "contactPersons", header: "Contact Persons", width: 40 },
      documentArray: { key: "documentArray", header: "Documents", width: 30 },
      createdAt: { key: "createdAt", header: "Created At", width: 20 },
      updatedAt: { key: "updatedAt", header: "Updated At", width: 20 }
    };
  
    if (fields.length === 0) {
      // Return all fields if none specified
      return Object.values(fieldMapping);
    }
  
    return fields
      .map((field: string) => fieldMapping[field as keyof typeof fieldMapping])
      .filter((item) => Boolean(item));
  };

  export const downloadTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Contact Template", {
        pageSetup: { paperSize: 9, orientation: "landscape" },
      });
  
      // Define template columns
      worksheet.columns = [
        { header: "Customer Type*", key: "customerType", width: 15 },
        { header: "Salutation", key: "salutation", width: 10 },
        { header: "First Name*", key: "firstName", width: 15 },
        { header: "Last Name*", key: "lastName", width: 15 },
        { header: "Company Name", key: "companyName", width: 20 },
        { header: "Display Name*", key: "displayName", width: 20 },
        { header: "Email*", key: "email", width: 25 },
        { header: "Work Phone", key: "workPhone", width: 15 },
        { header: "Mobile Phone", key: "phone", width: 15 },
        { header: "PAN Number", key: "panNumber", width: 15 },
        { header: "GST Treatment", key: "gstTreatment", width: 15 },
        { header: "Tax Preference", key: "taxPreference", width: 15 },
        { header: "Currency", key: "currency", width: 10 },
        { header: "Payment Terms", key: "paymentTerms", width: 15 },
        { header: "Website URL", key: "websiteUrl", width: 20 },
        { header: "Department", key: "department", width: 15 },
        { header: "Designation", key: "designation", width: 15 },
        { header: "Twitter", key: "twitter", width: 15 },
        { header: "Skype", key: "skype", width: 15 },
        { header: "Facebook", key: "facebook", width: 15 },
        { header: "Prefers Email", key: "prefersEmail", width: 12 },
        { header: "Prefers SMS", key: "prefersSms", width: 12 },
        // Address fields
        { header: "Country/Region", key: "countryRegion", width: 15 },
        { header: "Address Line 1", key: "addressStreet1", width: 25 },
        { header: "Address Line 2", key: "addressStreet2", width: 25 },
        { header: "City", key: "city", width: 15 },
        { header: "State", key: "state", width: 15 },
        { header: "PIN Code", key: "pinCode", width: 10 },
        { header: "Phone", key: "phoneNumber", width: 15 },
        { header: "Fax", key: "faxNumber", width: 15 },
        // Shipping Address fields
        { header: "Shipping Country/Region", key: "shippingCountryRegion", width: 15 },
        { header: "Shipping Address Line 1", key: "shippingAddressStreet1", width: 25 },
        { header: "Shipping Address Line 2", key: "shippingAddressStreet2", width: 25 },
        { header: "Shipping City", key: "shippingCity", width: 15 },
        { header: "Shipping State", key: "shippingState", width: 15 },
        { header: "Shipping PIN Code", key: "shippingPinCode", width: 10 },
        { header: "Shipping Phone", key: "shippingPhoneNumber", width: 15 },
        { header: "Shipping Fax", key: "shippingFaxNumber", width: 15 },
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
        customerType: "customer",
        salutation: "Mr.",
        firstName: "John",
        lastName: "Doe",
        companyName: "ABC Corp",
        displayName: "John Doe (ABC Corp)",
        email: "john.doe@example.com",
        workPhone: "1234567890",
        phone: "9876543210",
        panNumber: "ABCDE1234F",
        gstTreatment: "regular",
        taxPreference: "taxable",
        currency: "INR",
        paymentTerms: "Net 30",
        websiteUrl: "www.abc-corp.com",
        department: "Sales",
        designation: "Manager",
        twitter: "@johndoe",
        skype: "john.doe",
        facebook: "facebook.com/john.doe",
        prefersEmail: true,
        prefersSms: false,
        countryRegion: "India",
        addressStreet1: "123 Main Street",
        addressStreet2: "Suite 100",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        phoneNumber: "1234567890",
        faxNumber: "1234567891",
        shippingCountryRegion: "India",
        shippingAddressStreet1: "123 Main Street",
        shippingAddressStreet2: "Suite 100",
        shippingCity: "Mumbai",
        shippingState: "Maharashtra",
        shippingPinCode: "400001",
        shippingPhoneNumber: "1234567890",
        shippingFaxNumber: "1234567891",
      });
  
      // Add dropdown validations
      // Customer Type dropdown
      worksheet.getCell("A2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"customer,vendor,partner"'],
      };
  
      // GST Treatment dropdown
      worksheet.getCell("K2").dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"regular,composition,unregistered,consumer,overseas,special economic zone,deemed export"'],
      };
  
      // Tax Preference dropdown
      worksheet.getCell("L2").dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"taxable,nil rated,exempt"'],
      };
  
      // Prefers Email dropdown
      worksheet.getCell("U2").dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"TRUE,FALSE"'],
      };
  
      // Prefers SMS dropdown
      worksheet.getCell("V2").dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"TRUE,FALSE"'],
      };
  
      // Add instructions
      const instructionSheet = workbook.addWorksheet("Instructions");
      instructionSheet.columns = [
        { header: "Field", key: "field", width: 25 },
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
          field: "Customer Type",
          description: "Type of contact (customer, vendor, partner)",
          required: "Yes",
        },
        { field: "Salutation", description: "Title (Mr., Mrs., Ms., Dr., etc.)", required: "No" },
        { field: "First Name", description: "Contact's first name", required: "Yes" },
        { field: "Last Name", description: "Contact's last name", required: "Yes" },
        { field: "Company Name", description: "Contact's company name", required: "No" },
        { field: "Display Name", description: "Name to display for this contact", required: "Yes" },
        { field: "Email", description: "Contact's email address", required: "Yes" },
        { field: "Work Phone", description: "Contact's work phone number", required: "No" },
        { field: "Mobile Phone", description: "Contact's mobile phone number", required: "No" },
        { field: "PAN Number", description: "Contact's PAN number", required: "No" },
        { field: "GST Treatment", description: "GST treatment for the contact", required: "No" },
        { field: "Tax Preference", description: "Tax preference for the contact", required: "No" },
        { field: "Currency", description: "Default currency for transactions", required: "No" },
        { field: "Payment Terms", description: "Default payment terms", required: "No" },
        { field: "Website URL", description: "Company website URL", required: "No" },
        { field: "Department", description: "Contact's department", required: "No" },
        { field: "Designation", description: "Contact's job title", required: "No" },
        { field: "Twitter", description: "Twitter handle", required: "No" },
        { field: "Skype", description: "Skype ID", required: "No" },
        { field: "Facebook", description: "Facebook URL", required: "No" },
        { field: "Prefers Email", description: "Whether contact prefers email communication", required: "No" },
        { field: "Prefers SMS", description: "Whether contact prefers SMS communication", required: "No" },
        { field: "Country/Region", description: "Billing address country/region", required: "No" },
        { field: "Address Line 1", description: "Billing address line 1", required: "No" },
        { field: "Address Line 2", description: "Billing address line 2", required: "No" },
        { field: "City", description: "Billing address city", required: "No" },
        { field: "State", description: "Billing address state", required: "No" },
        { field: "PIN Code", description: "Billing address postal code", required: "No" },
        { field: "Phone", description: "Billing address phone", required: "No" },
        { field: "Fax", description: "Billing address fax", required: "No" },
        { field: "Shipping Country/Region", description: "Shipping address country/region", required: "No" },
        { field: "Shipping Address Line 1", description: "Shipping address line 1", required: "No" },
        { field: "Shipping Address Line 2", description: "Shipping address line 2", required: "No" },
        { field: "Shipping City", description: "Shipping address city", required: "No" },
        { field: "Shipping State", description: "Shipping address state", required: "No" },
        { field: "Shipping PIN Code", description: "Shipping address postal code", required: "No" },
        { field: "Shipping Phone", description: "Shipping address phone", required: "No" },
        { field: "Shipping Fax", description: "Shipping address fax", required: "No" },
      ];
  
      instructions.forEach((instruction) => {
        instructionSheet.addRow(instruction);
      });
  
      // Generate file
      const timestamp = new Date().getTime();
      const filename = `contact_import_template_${timestamp}.xlsx`;
      const directory = path.join("public", "uploads");
  
      // Ensure directory exists
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
  
      const filePath = path.join(directory, filename);
      await workbook.xlsx.writeFile(filePath);
  
      res.json({
        status: "success",
        message: "Contact template downloaded successfully",
        filename: filename,
      });
    } catch (error) {
      console.error("Contact template download error:", error);
      next(error);
    }
  };
