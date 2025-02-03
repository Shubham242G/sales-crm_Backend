import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { Lead } from "@models/lead.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";






export const addLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await Lead.findOne({ name: req.body.phone }).exec();
        // if (existsCheck) {
        //     throw new Error("Lead with same email already exists");
        // }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     console.log("first", req.body.imagesArr)
        //     for (const el of req.body.imagesArr) {
        //         if (el.image && el.image !== "") {
        //             el.image = await storeFileAndReturnNameBase64(el.image);
        //         }
        //     }
        // }

        console.log(
            "check 2 ", "for check lead"
        )
        const lead = await new Lead(req.body).save();
        res.status(201).json({ message: "Lead Created" });


    } catch (error) {
        next(error);
    }
};

export const getAllLead = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let LeadArr = await paginateAggregate(Lead, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: LeadArr.data, total: LeadArr.total });
    } catch (error) {
        next(error);
    }
};

export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await Lead.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Banquet does not exists");
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

export const updateLeadById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Lead.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Lead does not exists");
        }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     for (const el of req.body.imagesArr) {
        //         if (el.images && el.images !== "" && el.images.includes("base64")) {
        //             el.images = await storeFileAndReturnNameBase64(el.images);
        //         }
        //     }
        // }
        let Obj = await Lead.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Lead Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteLeadById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Lead.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Lead does not exists or already deleted");
        }
        await Lead.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Lead Deleted" });
    } catch (error) {
        next(error);
    }
};


 export const convertToContact = async (req: Request, res: Response, next: NextFunction) => {
        // try {
        //     let existsCheck = await SalesContact.findOne({ firstName: req.body.first,  lastName: req.body.last, companyName: req.body.company }).exec();
        //     if (existsCheck) {
        //         throw new Error("Contact with same name already exists");
        //     }

        console.log( req.params.id , 
            
        "check params id lead"
            
        )

        try{
            const lead = await Lead.findById(req.params.id).exec();
            if (!lead) {
                throw new Error("Lead not found");
        }
    
            // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
            //     console.log("first", req.body.imagesArr)
            //     for (const el of req.body.imagesArr) {
            //         if (el.image && el.image !== "") {
            //             el.image = await storeFileAndReturnNameBase64(el.image);
            //         }
            //     }
            // }


         
            const existingContact = await SalesContact.findOne({ leadId: req.params.id}).exec();
            if (existingContact) {
                throw new Error("A contact already exists for this lead.");
              }

  

            if (lead) {
    
    
                    const salesContact = new SalesContact({
                        firstName: lead.firstName, 
                        lastName: lead.lastName,
                        phone: lead.phone,
                        email: lead.email,
                        company: lead.company,
                        salutation: lead.salutation,
                        contactId: lead._id,
                        
                    });
    
                    await salesContact.save();
    
                    res.status(200).json({ message: "Contact conversion completed successfully", data: salesContact }); }
    
             
    
    
          
    
            res.status(500).json({ message: "Something Went Wrong", });
    
    
    
        } catch (error) {
            next(error);
        };
    }

    








