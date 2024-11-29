import { REQUEST_TYPES_STRINGS } from "@common/request.common";
import { IUser } from "@models/user.model";
import mongoose, { Document, Model, Types } from "mongoose";
import { RequestQues, IRequestQues } from "@models/RequestQues.model";
import { Log, ILog } from "@models/log.model";
import { GENERALSTATUS } from "@common/constant.common";
export const addApprovalRequest = async <T = unknown>(
    model: Model<T, {}, {}, {}, Document<unknown, {}, T> & T & { _id: Types.ObjectId }, any>,
    documentObjectId: mongoose.Types.ObjectId,
    userObj:
        | (IUser &
              Required<{
                  _id: mongoose.Types.ObjectId;
              }>)
        | null,
    requestType: REQUEST_TYPES_STRINGS,
    payload: any,
    approvalArr: {
        name: string;
        approverId: mongoose.Types.ObjectId;
        approvalStatus: boolean;
    }[],
    previousDataObj: any,
    changeObj: any,
    message: string
) => {
    ////////////checking if user is found or not if not then throwing an error
    if (!userObj) {
        throw new Error("User not found or deleted !!!");
    }
    ////////////
    let DataObj: IRequestQues = {
        requestType,
        requestPayload: { ...payload, origionalId: documentObjectId },
        createdByName: userObj?.name,
        createdById: userObj?._id,
        createdByRole: userObj?.role,
        approvalArr,
    };

    if (previousDataObj) {
        DataObj.previousPayload = previousDataObj;
    }

    await new RequestQues(DataObj).save();

    let logObj: ILog = {
        ...DataObj,
        message,
    };

    if (changeObj) {
        logObj.changeObj = changeObj;
    }

    await new Log(logObj).save();

    console.log(
        approvalArr.some((el) => el.approvalStatus == false),
        "approvalArr.some(el => el.approvalStatus == false)",
        approvalArr
    );

    await model.findByIdAndUpdate(documentObjectId, { status: approvalArr.some((el) => el.approvalStatus == false) ? GENERALSTATUS.PENDING : GENERALSTATUS.APPROVED, approvalPending: approvalArr.some((el) => el.approvalStatus == false) }).exec();
};

// SENTTOSTORE
