import mongoose, { Schema, Types, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IStore {
  _id: Types.ObjectId;
  name: string;
  rawMaterialArr: {
    rawMaterialId: mongoose.Types.ObjectId;
  }[];

  createdAt: Date;
  updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const storesSchema = new Schema<IStore>(
  {
    name: String,
    rawMaterialArr: [{
      rawMaterialId: mongoose.Types.ObjectId,
    }],
    // And `Schema.Types.ObjectId` in the schema definition.
  },
  { timestamps: true }
);

export const Store = model<IStore>("store", storesSchema);








