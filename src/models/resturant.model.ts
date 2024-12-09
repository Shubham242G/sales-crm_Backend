import { model, Model, Schema, Types } from "mongoose";


interface IResturant {
    foodOptions : string,
    noOfOccupancy : string,
    floor : string,
    swimmingPool : string,
    imagesArr: {
        image: string
    }[]
};


const ResturantSchema = new Schema({
    foodOptions : String,
    noOfOccupancy : String,
    floor : String,
    swimmingPool : String,
    imagesArr: [{
        image: String
    }]
})

export const Resturant = model<IResturant>("Resturant", ResturantSchema);
