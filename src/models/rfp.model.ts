
import { model, Model, Schema, Types } from "mongoose";


interface IVendorList {
    label: string;
    value: string;
}

interface IRfp {

    rfpId: String;
    enquiryId: Types.ObjectId;
    serviceType: [];
    leadId: Types.ObjectId;
    status: string;
    displayName: string;
    eventDates: [{
            startDate: Date,
            endDate: Date
        }],
    eventDetails: string ; 
    fullName : string;

    deadlineOfProposal: string;
    vendorList: IVendorList[];
    additionalInstructions: string;



}




const RfpSchema = new Schema({
  
    rfpId: String ,
    enquiryId: Types.ObjectId,
    status: String,
    leadId: Types.ObjectId,
    serviceType: [],
    displayName: String,
    eventDates: [{
        startDate: Date,
        endDate: Date,
    }],   
    fullName : String,
    eventDetails: String,
    deadlineOfProposal: String,
    vendorList: [], 
    additionalInstructions: String,


},
    { timestamps: true }
);

export const Rfp = model<IRfp>("Rfp", RfpSchema);
