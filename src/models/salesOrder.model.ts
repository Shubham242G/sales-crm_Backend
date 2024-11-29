import { SALE_ORDER_STATUS_TYPE ,SALE_ORDER_STATUS, SERIES_FOR} from "@common/constant.common";
import mongoose, { Schema, Types, model } from "mongoose";
import { ICustomer } from "./customer.model";
import { IProduct } from "./product.model";

// 1. Create an interface representing a document in MongoDB.
export interface ISalesOrder {
    customerId: mongoose.Types.ObjectId;
    deliveryDate: Date;
    customerObj:ICustomer;
    salesOrderNumber:string,
    productsArr: {
        productObj:IProduct
        productId: mongoose.Types.ObjectId;
        quantity: Number;
        uom: String;
    }[];
    approvalPending:Boolean,
    soType:string,
    file:String;
    type:String;
    status:String,
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const salesOrderSchema = new Schema<ISalesOrder>(
    {
        customerId: mongoose.Types.ObjectId,
        deliveryDate: Date,
        type:String,
        file:String,
        customerObj:Schema.Types.Mixed,
        soType:{type:String,default:SERIES_FOR.RAW_MATERIAL},
        salesOrderNumber:String,
        approvalPending:{type:Boolean, default:true},
        status:{type:String,default:SALE_ORDER_STATUS.SENTTOSTORE},
        productsArr: [
            {
                productObj:Schema.Types.Mixed,
                productId: mongoose.Types.ObjectId,
                quantity: Number,
                uom: String,
            },
        ],
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const SalesOrder = model<ISalesOrder>("salesOrder", salesOrderSchema);
