import { Schema, Types, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface ISchedulingSheet {
    scheduledDate: Date;
    machineId: Types.ObjectId;
    workOrderId: Types.ObjectId;
    machinePosition: number;
    // machineMaxQuantity: number;
    dayCapacityInUnits: number;
    hoursUsed: number;
    dayCapacityUtilizedInHours: number;
    productIdArr: {
        productId: Types.ObjectId;
        quantity: Number;
        hourlyCapacity: number;
        hoursUsed: number;
        dailyCapacity: number;
    }[];
    createdAt: Date;
    updateAt: Date;
    _id: Types.ObjectId;
}

// 2. CscheduledStartDatereate a Schema corresponding to the document interface.
const schedulingSheetSchema = new Schema<ISchedulingSheet>(
    {
        scheduledDate: Date,
        machineId: Types.ObjectId,
        workOrderId: Types.ObjectId,
        machinePosition: Number,
        // machineMaxQuantity: Number,
        hoursUsed: Number,
        dayCapacityInUnits: Number,
        dayCapacityUtilizedInHours: Number,
        productIdArr: [
            {
                productId: Types.ObjectId,
                quantity: Number,
                hoursUsed: Number,
                hourlyCapacity: Number,
                dailyCapacity: Number,
            },
        ],
    },
    { timestamps: true }
);

export const SchedulingSheet = model<ISchedulingSheet>("schedulingsheets", schedulingSheetSchema);
