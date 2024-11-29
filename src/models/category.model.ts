import { Schema, Types, model } from "mongoose";

interface ICategory {
  _id: Types.ObjectId;
  name: string;
  createdAt: Date;
  updateAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: String,
  },
  { timestamps: true }
);

export const Category = model<ICategory>("category", CategorySchema);
