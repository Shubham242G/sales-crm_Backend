import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IRequestQues {
    requestType: string;
    previousPayload?: Schema.Types.Mixed;
    changeObj?: Schema.Types.Mixed;
    requestPayload: Schema.Types.Mixed;
    createdByName: string;
    createdById: mongoose.Types.ObjectId;
    createdByRole: string;
    approvalArr: {
        name: string;
        approverId: mongoose.Types.ObjectId;
        approvalStatus: Boolean;
    }[];
    createdAt?: Date;
    updateAt?: Date;
}

// 2. Create a Schema corresponding to the document interface.
const RequestQuesSchema = new Schema<IRequestQues>(
    {
        requestType: String,
        previousPayload: Schema.Types.Mixed,
        changeObj: Schema.Types.Mixed,
        requestPayload: Schema.Types.Mixed,
        createdByName: String,
        createdById: mongoose.Types.ObjectId,
        createdByRole: String,
        approvalArr: [
            {
                name: String,
                approverId: mongoose.Types.ObjectId,
                approvalStatus: {type:Boolean, default:false},
            },
        ],
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const RequestQues = model<IRequestQues>("RequestQues", RequestQuesSchema);
