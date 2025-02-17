
import { model, Model, Schema, Types } from "mongoose";




interface IRfp {

    rfpId: String;
    enquiryId: Types.ObjectId;
    serviceType: [];


    eventDates: [{
            startDate: Date,
        }],
    eventDetails: string;

    deadlineOfProposal: string;
    vendorList: [];
    additionalInstructions: string;



}




const RfpSchema = new Schema({
  
    rfpId: String ,
    enquiryId: Types.ObjectId,
    serviceType: [],
    eventDates: [{
        startDate: Date,
    }],
    eventDetails: String,
    deadlineOfProposal: String,
    vendorList: [],
    additionalInstructions: String,


},
    { timestamps: true }
);

export const Rfp = model<IRfp>("Rfp", RfpSchema);
