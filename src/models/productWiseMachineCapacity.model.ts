import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IProductWiseMachineCapacity {
  productId: mongoose.Types.ObjectId;
  machineId: mongoose.Types.ObjectId;
  value: number;
  productCode: string;
  machineName: string;
  createdAt: Date;
  updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const productWiseMachineCapacitySchema =
  new Schema<IProductWiseMachineCapacity>(
    {
      productId: mongoose.Types.ObjectId,
      machineId: mongoose.Types.ObjectId,
      productCode: String,
      machineName: String,
      value: Number,
      // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
  );

export const ProductWiseMachineCapacity = model<IProductWiseMachineCapacity>(
  "ProductWiseMachineCapacity",
  productWiseMachineCapacitySchema
);
