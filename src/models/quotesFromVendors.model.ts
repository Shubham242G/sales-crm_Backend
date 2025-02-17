import { model, Model, Schema, Types } from "mongoose";









interface IQuotesFromVendors {

    quotesId: string;
    rfqId: string;
    rfpEnquiryId:string;
    vendorName: string ;
    serviceType : [];
    rfpId: string;
    amount: string;
    receivedDate: string;
    status: string;
    attachment: string;
    eventDates: [{
            startDate: Date,
        }],



}




const QuotesFromVendorsSchema = new Schema({
  
    quotesId: String,
    rfqId: String,
    rfpEnquiryId: String,
    vendorName: String ,
    serviceType : [],
    rfpId: String,
    amount: String,
    receivedDate: String,
    status: String,
    attachment: String,
    eventDates: [{
            startDate: Date,
        }],



},
    { timestamps: true }
);

export const QuotesFromVendors = model<IQuotesFromVendors>("QuotesFromVendors", QuotesFromVendorsSchema);
