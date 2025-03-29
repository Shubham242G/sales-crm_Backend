import { model, Model, Schema, Types } from "mongoose";




interface IDashboard {


    costOfVendor: string;
    businessFromCustomer: string;
    revenue: string;
    
   


    
}


const DashboardSchema = new Schema(
    {

        costOfVendor: String,
        businessFromCustomer: String,
        revenue: String,
        




    },
    { timestamps: true }
);

export const Dashboard = model<IDashboard>("Dashboard", DashboardSchema);
