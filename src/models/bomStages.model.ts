import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IBOM_STAGES {
    bomId: mongoose.Types.ObjectId;
    stageName: string;
    rawMaterialArr: {
        rawMaterialId: mongoose.Types.ObjectId;
        count: number;
        isPolymer: boolean; //////if yes then consider in percentage else consider in number
        scrapPercentage: number;
        unit: string;
        
    }[];
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const bomStagesSchema = new Schema<IBOM_STAGES>(
    {
        bomId: Schema.Types.ObjectId,
        stageName: String,
        rawMaterialArr: [
            {
                rawMaterialId: mongoose.Types.ObjectId,
                count: Number,
                isPolymer: Boolean,
                scrapPercentage: Number,
                unit: String,
            },
        ],
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const BomStage = model<IBOM_STAGES>("BomStage", bomStagesSchema);
