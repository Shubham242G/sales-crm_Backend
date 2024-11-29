import { GENERALSTATUS } from "@common/constant.common";
import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IMOC {
    name: string;
    retailerid:string
    rawMaterialsArr: {
        rawMaterialId: mongoose.Types.ObjectId;
        productName: string;
        quantity: number;
    }[];
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const mocSchema = new Schema<IMOC>(
    {
        name: String,
        retailerid:String,
        rawMaterialsArr: [
            {
                productName: String,
                rawMaterialId: mongoose.Types.ObjectId,
                quantity: Number,
            },
        ],
    },
    { timestamps: true }
);

export const MOC = model<IMOC>("MOC", mocSchema);
