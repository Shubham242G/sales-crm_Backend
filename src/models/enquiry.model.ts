
import { model, Model, Schema, Types } from "mongoose";




interface IEnquiry {

    _id: Types.ObjectId;
    name: string;
    phone: string;
    email: string;
    companyName: string
    levelOfEnquiry: string;
    enquiryType: string;
    hotelPreferences: string;
    checkIn: Date;
    checkOut: Date;
    city: string;
    area: string;
    numberOfRooms: string;
    categoryOfHotel: { type: string }[];
    priority: string;
    occupancy: { type: string }[]
    banquet: {
        date: Date;
        session: string;
        seatingStyle: string;
        avSetup: string;
        menuType: string;
        noOfPax: string;
        seatingRequired: string;
    }[];
    room: {
        date: string;
        noOfRooms: string;
        roomCategory: string;
        occupancy: string;
        mealPlan: [];
    }[];
    eventSetup: {
        functionType: string;
        eventDates: {
            startDate: string;
            endDate: string;
        }[]
        setupRequired: string;
        eventStartDate:string,
        eventEndDate: string;
    };
    airTickets: {
        tripType: string;
        numberOfPassengers: string;
        fromCity: string;
        toCity: string;
        departureDate: Date;
        returnDate: Date;

    };
    cab: {
        date: Date;
        fromCity: string;
        toCity: string;
        vehicleType: string;
        tripType: string;
        noOfVehicle: string;
        typeOfVehicle: string;
        cabTripType: string;
        mealPlan: [];
    }[];
    billingAddress: string;

    createdAt: Date;
    updateAt: Date;
}




const EnquirySchema = new Schema({
    name: String,
    phone: String,
    email: String,
    companyName: String,
    typeOfContact: String,
    levelOfEnquiry: String,
    enquiryType: String,
    hotelPreferences: String,
    checkIn: Date,
    checkOut: Date,
    city: String,
    area: String,
    numberOfRooms: String,
    categoryOfHotel: [{ type: String }],
    priority: String,
    occupancy: [{ type: String }],
    banquet: [{
        date: Date,
        session: String,
        seatingStyle: String,
        avSetup: String,
        menuType: String,
        noOfPax: String,
        seatingRequired: String,
    }],
    room: [{
        date: String,
        noOfRooms: String,
        roomCategory: String,
        occupancy: String,
        mealPlan: [],
    }],
    eventSetup: {
        functionType: String,
        eventDates: [{
            startDate: Date,
            endDate: Date,
        }],
        eventSetupRequired: String,
        eventStartDate:String,
        eventEndDate: String,
    },
    airTickets: {
        tripType: String,
        numberOfPassengers: String,
        fromCity: String,
        toCity: String,
        departureDate: Date,
        returnDate: Date,

    },
    cab: [{
        date: Date,
        fromCity: String,
        toCity: String,
        vehicleType: String,
        tripType: String,
        noOfVehicle: String,
        typeOfVehicle: String,
        cabTripType: String,
        mealPlan: [],
    }],
    billingAddress: String,

},
    {
        timestamps: true
    }

);

export const Enquiry = model<IEnquiry>("Enquiry", EnquirySchema);
