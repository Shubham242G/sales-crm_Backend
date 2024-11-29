import { Schema, Types, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IWorkOrder {
    name: string;
    woNumber: string;
    customerName: string;
    customerId: Types.ObjectId;
    salesOrderId: Types.ObjectId;
    productId: Types.ObjectId;
    deliveryDate: Date;
    finalWidth: number;
    lengthOfRoll: number;
    numberOfRolls: number;
    quantity: number;
    rollWeight: number;
    salesOrderQuantityWeight: number;
    workOrderQuantityWight: string;
    thickness: number;
    soType: string;
    salesOrderStatus: string;
    salesOrderNumber: string;
    poNumber: string;
    productName: string;
    productDescription: string;
    customerObj: Record<string, any>;
    bomObj: Record<string, any>;
    poObj: Record<string, any>;
    productObj: Record<string, any>;
    qcStagesArr: Record<string, any>[];
    stagesArr: {
        stageName: string;
        dataArr: Record<string, any>[];
    }[];
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const WorkOrderSchema = new Schema<IWorkOrder>(
    {
        name: String,
        woNumber: String,
        customerName: String,
        customerId: Types.ObjectId,
        deliveryDate: Date,
        salesOrderId: Types.ObjectId,
        productId: Types.ObjectId,
        finalWidth: Number,
        lengthOfRoll: Number,
        numberOfRolls: Number,
        quantity: Number,
        rollWeight: Number,
        salesOrderQuantityWeight: Number,
        workOrderQuantityWight: String,
        thickness: Number,
        soType: String,

        customerObj: Schema.Types.Mixed,
        bomObj: Schema.Types.Mixed,
        poObj: Schema.Types.Mixed,
        productObj: Schema.Types.Mixed,
        qcStagesArr: Schema.Types.Mixed,
        salesOrderStatus: String,
        salesOrderNumber: String,
        poNumber: String,
        productName: String,
        productDescription: String,
        stagesArr: [
            {
                stageName: String,
                dataArr: Schema.Types.Mixed,
            },
        ],
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const WorkOrder = model<IWorkOrder>("workOrder", WorkOrderSchema);
