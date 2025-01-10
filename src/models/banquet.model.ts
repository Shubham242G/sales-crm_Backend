import { model, Model, Schema, Types } from "mongoose";


interface IBanquet {
    banquetName: string,
    size: string,
    setup: string,
    foodOption: string,
    vegPrice: string,
    nonVegPrice: string,
    PFAsize: string,
    imagesArr: {
        image: string
    }[]
    createdAt: Date;
    updateAt: Date;
};


const BanquetSchema = new Schema({
    banquetName: String,
    size: String,
    setup: String,
    foodOption: String,
    vegPrice: String,
    nonVegPrice: String,
    PFAsize: String,
    imagesArr: [{
        image: String
    }]

}, { timestamps: true })

export const Banquet = model<IBanquet>("Banquet", BanquetSchema);
