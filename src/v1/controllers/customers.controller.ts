import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Contact } from '@models/contact.model';
import { zohoRequest } from '../../util/zoho'; // Ensure this fetches customers from Zoho
import { PipelineStage } from 'mongoose';
import { paginateAggregate } from '@helpers/paginateAggregate';
import { save } from 'pdfkit';
import { storeFileAndReturnNameBase64 } from '@helpers/fileSystem';






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
            throw new Error("Lead does not exists or already deleted");
        }
        await Contact.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Lead Deleted" });
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
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
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
