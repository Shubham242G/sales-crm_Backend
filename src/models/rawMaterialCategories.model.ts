import { RAW_MATERIAL_CATEGORY_TYPE, RAW_MATERIAL_CATEGORY_TYPE_TYPES, STAGES, STAGES_TYPE } from "@common/constant.common";
import { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IRawMaterialCategories {
  name: string;
  materialType: string,
  isPolymer:boolean,
  stageName:STAGES_TYPE,
  createdAt: Date;
  updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const rawMaterialCategoriesSchema = new Schema<IRawMaterialCategories>(
  {
    name: String,
    isPolymer:Boolean,
    materialType:String,
    stageName:String,
    // And `Schema.Types.ObjectId` in the schema definition.
  },
  { timestamps: true }
);

export const RawMaterialCategories = model<IRawMaterialCategories>("RawMaterialCategories", rawMaterialCategoriesSchema);
