import { SERIES_FOR_TYPE, SERIES_TYPE_TYPE } from "@common/constant.common";
import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface ISeries {
  str: string;
  latestValue: string;
  financialYear?: string;
  count?: number;
}

// 2. Create a Schema corresponding to the document interface.
const seriesSchema = new Schema<ISeries>(
  {
    str: String,
    latestValue: String,
    financialYear: String,
    count: Number,
  },
  { timestamps: true }
);

export const Series = model<ISeries>("series", seriesSchema);
