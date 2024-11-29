import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IQualityControlBaseData {
    productId: mongoose.Types.ObjectId;
    stagesArr: {
        stageName: string;
        stageDetailQcArr: {
            name: string;
            filmGSM: number;
            filmWidth1: number;
            filmWidth2: number;
            rollLength: number;
            testArr: {
                name: string;
                pointsArr: {
                    name: string;
                    minValue: number;
                    maxValue: number;
                    value: number;
                    unit: string;
                    isIncludedInWorkOrder: boolean;
                }[];
            }[];
        }[];
    }[];

    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const QualityControlBaseDataSchema = new Schema<IQualityControlBaseData>(
    {
        productId: mongoose.Types.ObjectId,
        stagesArr: [
            {
                stageName: String,
                stageDetailQcArr: [
                    {
                        name: String,
                        filmGSM: Number,
                        filmWidth1: Number,
                        filmWidth2: Number,
                        rollLength: Number,
                        testArr: [
                            {
                                name: String,
                                pointsArr: [
                                    {
                                        name: String,
                                        unit: String,
                                        minValue: Number,
                                        maxValue: Number,
                                        value: Number,
                                        isIncludedInWorkOrder: { type: Boolean, default: false },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    { timestamps: true }
);

export const QualityControlBaseData = model<IQualityControlBaseData>("QualityControlBaseData", QualityControlBaseDataSchema);
