import { model, Model, Schema, Types } from "mongoose";


interface IHotel {
    _id:Types.ObjectId;
    name : string,
    vendorId : Types.ObjectId,
    noOfRooms : string,
    size : String,
    price : string,
    imagesArr : {
        image : string
    }[]
};


const hotelSchema = new Schema({
    name : String,
    vendorId : Types.ObjectId,
    noOfRooms : String,
    size : String,
    price : String,
    imagesArr : [{
        image : String
    }]
})

export const Hotel = model<IHotel>("hotel",hotelSchema);
