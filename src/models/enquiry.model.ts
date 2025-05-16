import { model, Model, Schema, Types } from "mongoose";




interface IEnquiry {

    _id: Types.ObjectId;
    contactId: Types.ObjectId;
    salutation: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    companyName: string;
    leadOwner: string;
    assignTo: string;
    displayName: string;
    hotelName: string;
    othersPreference: string;
    approxPassengers: string;
    levelOfEnquiry: string;
    enquiryType: string;
    hotelPreferences: string;
    banquetDate: { type: Date },    
    banquetTime: { type: String },
    
    checkIn: Date;
    checkOut: Date;
    city: string;
    area: string;
    noOfRooms: string;
    categoryOfHotel: string[];
    status: string;
    // priority: string;
    occupancy: string[];
    banquet: {
        date: Date;
        session: string[];
        seatingStyle: string;
        avSetup: string;
        menuType: string;
        minPax: string;
        seatingRequired: string;
    }[];
    room: {
        date: string;
        noOfRooms: string;
        roomCategory: string;
        occupancy: string;
        mealPlan: string[];
    }[];
    eventSetup: {
        functionType: string;
        eventDates: {
            startDate: string;
            endDate: string;
        }[]
        setupRequired: string;
        eventStartDate: string,
        eventEndDate: string;
    };
    airTickets: {
        tripType: string;
        numberOfPassengers: string;
        fromCity: string;
        toCity: string;
        departureDate: Date;
        returnDate: Date;
        multiFromCity: string;
        multiToCity: string;
        multiDepartureDate: Date;
    };
    cab: {
        date: Date;
        fromCity: string;
        toCity: string;
        vehicleType: string;
        tripType: string;
        noOfVehicles: string;
        typeOfVehicle: string;
        cabTripType: string;
    }[];
    billingInstructions: string;

    createdAt: Date;
    updateAt: Date;
}




const EnquirySchema = new Schema({
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    salutation: String,
    firstName: String,
    lastName: String,
    phoneNumber: String,
    email: String,
    companyName: String,
    displayName: String,
    leadOwner: String,
    assignTo: String,
    typeOfContact: String,
    levelOfEnquiry: String,
    hotelName: String,
    othersPreference: String,
    approxPassengers: String,
    enquiryType: String,
    hotelPreferences: String,
    banquetDate: Date,
    banquetTime: String,
    city: String,
    area: String,
    noOfRooms: String,
    categoryOfHotel: [String],
    priority: String,
    occupancy: [String],
    status: String,
    banquet: [{
        date: Date,
        session: [],
        seatingStyle: String,
        avSetup: String,
        menuType: String,
        minPax: String,
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
        setupRequired: String,
        eventStartDate: String,
        eventEndDate: String,
    },
    airTickets: {
        tripType: String,
        numberOfPassengers: String,
        fromCity: String,
        toCity: String,
        departureDate: Date,
        returnDate: Date,
        multiFromCity: String,
        multiToCity: String,
        multiDepartureDate: Date,
    },
    cab: [{
        date: Date,
        fromCity: String,
        toCity: String,
        vehicleType: String,
        tripType: String,
        noOfVehicles: String,
        typeOfVehicle: String,
        cabTripType: String,
    }],
    billingInstruction: String,

},
    {
        timestamps: true
    }

);

export const Enquiry = model<IEnquiry>("Enquiry", EnquirySchema);
