import { RAW_MATERIAL_REQUEST } from "@common/constant.common";
import { paginateAggregate } from "@helpers/paginateAggregate";
import { RawMaterialRequest } from "@models/RawMaterialRequest.model";
import { RequestHandler } from "express";

export const requestRawMaterial: RequestHandler = async (req, res, next) => {
    try {
        // req.body.requestedBy = req?.user?.user?._id;


        if(!req.body){
            throw new Error("Invalid request submitted")
        }
        if(!req?.user?.user?._id){
            throw new Error("Unauthorised access attempt blocked , please login again if you have access")
        }

        for (let index = 0; index < req.body.length; index++) {
            req.body[index].requestedBy = req?.user?.user?._id;
        }


        await RawMaterialRequest.insertMany(req.body)
        res.status(200).json({ message: "Requested Successfully" })
    } catch (error) {
        next(error)
    }
}


export const approveRawMaterialRequest: RequestHandler = async (req, res, next) => {
    try {
        let existCheck = await RawMaterialRequest.findById(req.params.id).exec();
        if (!existCheck)
            throw new Error('Invalid Raw Material Issue Request');

        await RawMaterialRequest.findByIdAndUpdate(req.params.id, { ...req.body, status: RAW_MATERIAL_REQUEST.APPROVED, approvedOrDenyDate: new Date() }).exec();
        res.status(200).json({ message: "Request Approved" })

    } catch (error) {
        next(error)
    }
}

export const denyRawMaterialRequest: RequestHandler = async (req, res, next) => {
    try {
        const existCheck = await RawMaterialRequest.findById(req.params.id).exec();
        if (!existCheck)
            throw new Error("Invalid Raw Material Issue Request");
        await RawMaterialRequest.findByIdAndUpdate(req.params.id, { status: RAW_MATERIAL_REQUEST.REJECTED, approvedOrDenyDate: new Date() }).exec();
        res.status(200).json({ message: "Request Denied" })
    } catch (error) {
        next(error)
    }
}

export const getRawMaterialRequest: RequestHandler = async (req, res, next) => {
    try {
        let pipeline: any = [
            {
                '$lookup': {
                    'from': 'rawmaterials',
                    'localField': 'rawMaterialId',
                    'foreignField': '_id',
                    'as': 'rawMaterial'
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'requestedBy',
                    'foreignField': '_id',
                    'as': 'requestBy'
                }
            }, {
                '$unwind': {
                    'path': '$rawMaterial',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$unwind': {
                    'path': '$requestBy',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$project': {
                    'rawMaterialName': '$rawMaterial.name',
                    '_id': 1,
                    'createdAt': 1,
                    'rawMaterialId': 1,
                    'rawMaterialApprovedArr': 1,
                    'quantity': 1,
                    'status': 1,
                    'requestedByName': '$requestBy.name'
                }
            }
        ];
        let matchObj: any = {};


        pipeline.push({
            $match: matchObj,

        });

        let RawMaterialRequestPaginateObj = await paginateAggregate(
            RawMaterialRequest,
            pipeline,
            req.query
        );

        res.status(201).json({
            message: "found all Request",
            data: RawMaterialRequestPaginateObj,
        });
    } catch (error) {
        next(error);
    }
}

export const getById: RequestHandler = async (req, res, next) => {
    try {
        const obj = await RawMaterialRequest.findById(req.params.id).exec();
        res.status(200).json({ message: "Get By Id", data: obj });
    } catch (error) {
        next(error)
    }
}