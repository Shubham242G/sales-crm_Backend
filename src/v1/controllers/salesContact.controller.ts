import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { SalesContact } from "@models/salesContact.model";
import ExcelJs from "exceljs";
import XLSX from "xlsx";
import path from 'path'
import { Enquiry } from "@models/enquiry.model";


export const addSalesContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await SalesContact.findOne({ firstName: req.body.name, lastName: req.body.lastName, phone: req.body.phone }).exec();
        if (existsCheck) {
            throw new Error("sales contact with same name already exists");
        }

        const Salescontact = await new SalesContact(req.body).save();
        res.status(201).json({ message: "salesContact Created" });

        
    } catch (error) {
        next(error);
    }
};

export const getAllSalesContact = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let salesContactArr = await paginateAggregate(SalesContact, pipeline, req.query);
        

        res.status(201).json({ message: "found all Device", data: salesContactArr.data, total: salesContactArr.total });
    } catch (error) {
        next(error);
    }
};

export const getSalesContactById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await SalesContact.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Sales contact does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific sales Contact",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateSalesContactById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await SalesContact.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("sales Contact does not exists");
        }

        
        let Obj = await SalesContact.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "sales Contact Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteSalesContactById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await SalesContact.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Sales Contact does not exists or already deleted");
        }
        await SalesContact.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Sales Contact Deleted" });
    } catch (error) {
        next(error);
    }
};


export const BulkUploadSalesContact: RequestHandler = async (req, res, next) => {
    try {
        let xlsxFile: any = req.file?.path;
        if (!xlsxFile) throw new Error("File Not Found");

        // Read the Excel file
        let workbook = XLSX.readFile(xlsxFile);
        let sheet_nameList = workbook.SheetNames;

        let xlData: any = [];
        sheet_nameList.forEach((element: any) => {
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[element]));
        });


        
        const fetchOrCreateRecord = async (model: any, name: any, cache: any, extraData: any = {}) => {
            if (cache.has(name)) return cache.get(name);
            let record = await model.findOne({ name }).lean().exec();
            if (!record) {
                record = await new model({ name, ...extraData }).save();
            }
            cache.set(name, record);
            return record;
        };


        const finalArr: any = [];
        for (let index = 0; index < xlData.length; index++) {
            const row = xlData[index];

            let query: any = {
                _id: row["ID"],
                firstName: row["Display Name"],
                phone: row["Phone"],
                email: row["Email"],

                
            };




            
            finalArr.push(query);
        }


        if (finalArr.length > 0) {
            await SalesContact.insertMany(finalArr);

        }

       
        res.status(200).json({ message: "Bulk upload Sales Contact completed successfully", data: finalArr });
    } catch (error) {
        next(error);
    }
};

export const downloadExcelSalesContact = async (req: Request, res: Response, next: NextFunction) => {
    try {


        
        const workbook = new ExcelJs.Workbook();
        const worksheet = workbook.addWorksheet("Bulk  Sales Contact", {
            pageSetup: { paperSize: 9, orientation: "landscape" },
        });

        worksheet.columns = [
            // Basic Details
            { header: "ID", key: "_id", width: 20 },
            { header: "Display Name", key: "name", width: 20 },
            { header: "Phone", key: "phone", width: 15 },
            { header: "Email", key: "email", width: 20 },
            { header: "Type of sales Contact", key: "typeOfSalesContact", width: 20 },
            
        ];

        let contacts = await SalesContact.find({}).lean().exec();

        contacts.forEach((contact) => {
            worksheet.addRow({
                _id: contact._id,
                displayName: contact.firstName,
                phone: contact.phone,
                email: contact.email,
            });
        });


        let filename = `${new Date().getTime()}.xlsx`
        const filePath = path.join("public", "uploads", filename);
        await workbook.xlsx.writeFile(`${filePath}`).then(() => {
            res.send({
                status: "success",
                message: "file successfully downloaded",
                filename: filename,
            });
        });

    } catch (error) {
        next(error);
    }
};


export const convertEnquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        if (req.params.id) {

            const contact = await SalesContact.findOne({ _id: req.params.id })
            if (contact) {


                const enquiry = new Enquiry({
                    salutation: contact.salutation,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    phoneNumber: contact.phoneNumber,
                    email: contact.email,
                    contactId: contact._id,
                    companyName: contact.company,
                    typeOfContact: "",
                    levelOfEnquiry: "",
                    hotelName: "",
                    othersPreference: "",
                    approxPassengers: "",
                    enquiryType: "",
                    hotelPreferences: "",
                    checkIn: "",
                    checkOut: "",
                    city: contact.city,
                    area: contact.area,
                    noOfRooms: "",
                    categoryOfHotel: [],
                    priority: "",
                    occupancy: [],
                    banquet: [{
                        date: "",
                        session: "",
                        seatingStyle: "",
                        avSetup: "",
                        menuType: "",
                        minPax: "",
                        seatingRequired: "",
                    }],
                    room: [{
                        date: "",
                        noOfRooms: "",
                        roomCategory: "",
                        occupancy: "",
                        mealPlan: [],
                    }],
                    eventSetup: {
                        functionType: "",
                        eventDates: [{
                            startDate: "",
                            endDate: "",
                        }],
                        setupRequired: "",
                        eventStartDate:"",
                        eventEndDate: "",
                    },
                    airTickets: {
                        tripType: "",
                        numberOfPassengers: "",
                        fromCity: "",
                        toCity: "",
                        departureDate: "",
                        returnDate: "",
                
                    },
                    cab: [{
                        date: "",
                        fromCity: "",
                        toCity: "",
                        vehicleType: "",
                        tripType: "",
                        noOfVehicles: "",
                        typeOfVehicle: "",
                        cabTripType: "",
                        mealPlan: [],
                    }],
                    billingAddress: "",
                
                
        
            
                });
    

                await enquiry.save();

                res.status(200).json({ message: "Enquiry conversion completed successfully", data: enquiry });

            }


        }

        res.status(500).json({ message: "Something Went Wrong", });



    } catch (error) {
        next(error);
    }
};

