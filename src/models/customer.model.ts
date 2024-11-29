import { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface ICustomer {
  name: string;
  email: string;
  phone: string;
  // customerCode: string;
  // billingAddress: string;
  // gstNumber: string;
  // shippingAddressArr: {
  //   address: string,
  // }[];
  createdAt: Date;
  updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const customerSchema = new Schema<ICustomer>(
  {
    name: String,
    email: String,
    phone: String,
    // gstNumber: String,
    // billingAddress: String,
    // shippingAddressArr: [
    //   {
    //     address: String,
    //   }
    // ],
    // customerCode: String,
    // And `Schema.Types.ObjectId` in the schema definition.
  },
  { timestamps: true }
);

export const Customer = model<ICustomer>("Customer", customerSchema);
