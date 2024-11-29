import {
    COATING_TYPE_TYPE,
    FILM_TYPE_TYPE,
    LAMINATION_TYPE_TYPE,
    LAMINATION_TYPES_TYPE,
    PRINTING_TYPE_TYPE,
} from "@common/constant.common";
import { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IProductCategories {
    name: string;
    filmType: FILM_TYPE_TYPE;
    printedType: PRINTING_TYPE_TYPE;
    laminationType: LAMINATION_TYPE_TYPE;
    laminateType: LAMINATION_TYPES_TYPE;
    coatingType: COATING_TYPE_TYPE; 
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const productCategoriesSchema = new Schema<IProductCategories>(
    {
        name: String,
        filmType: String,
        printedType: String,
        laminationType: String,
        laminateType: String,
        coatingType: String,
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const ProductCategories = model<IProductCategories>(
    "ProductCategories",
    productCategoriesSchema
);
