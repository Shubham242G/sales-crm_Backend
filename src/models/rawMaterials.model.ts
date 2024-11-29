import { RAW_MATERIAL_CATEGORY_TYPE, RAW_MATERIAL_CATEGORY_TYPE_TYPES, STAGES_TYPE } from "@common/constant.common";
import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IRawMaterials {
    name: string;
    safeCoCode: string;
    displayName: string;
    specification: string;
    materialType: RAW_MATERIAL_CATEGORY_TYPE_TYPES;
    stage: STAGES_TYPE;
    isPolymer: boolean;
    rawMaterialCategoryId: mongoose.Types.ObjectId;
    minStock: number;
    parametersArr: {
        name: string;
        value: string;
        unit: string;
        minvalue: string;
        maxvalue: string;
    }[];
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const rawMaterialsSchema = new Schema<IRawMaterials>(
    {
        name: String,
        safeCoCode: String,
        displayName: String,
        specification: String,
        isPolymer: Boolean,
        minStock: Number,
        materialType: {
            type: String,
            default: RAW_MATERIAL_CATEGORY_TYPE.INHOUSE,
        },
        stage: String,
        parametersArr: [
            {
                name: String,
                value: String,
                unit: String,
                minvalue: String,
                maxvalue: String,
            },
        ],
        rawMaterialCategoryId: mongoose.Types.ObjectId,
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const RawMaterials = model<IRawMaterials>("RawMaterials", rawMaterialsSchema);
