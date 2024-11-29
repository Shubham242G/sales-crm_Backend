import { FACTORY, FACTORY_TYPES, STAGES_TYPE } from "@common/constant.common";
import { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IMachine {
  machineCode: string;
  name: string;
  category: String;
  capacity: number; //////// in Kg/Hr
  unit: string;
  factory: FACTORY_TYPES;
  stage: STAGES_TYPE;
  changeOverTimeArr: {
    name: string,
    amount: number, //////////in hours
  }[];
  createdAt: Date;
  updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const machineSchema = new Schema<IMachine>(
  {
    machineCode: String,
    name: String,
    unit: String,
    category: String,
    stage: String,
    factory: {
      type: String,
      default: FACTORY.FACTORY708
    },
    capacity: Number, //////// in Kg/Hr
    changeOverTimeArr: [{
      name: String,
      amount: Number, //////////in hours
    }],
    // And `Schema.Types.ObjectId` in the schema definition.
  },
  { timestamps: true }
);

export const Machines = model<IMachine>("Machines", machineSchema);
