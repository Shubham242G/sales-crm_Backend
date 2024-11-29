import mongoose from "mongoose";
import { RequestQues } from "@models/RequestQues.model";
import { REQUEST_TYPES } from "@common/request.common";
import { SalesOrder } from "@models/salesOrder.model";
import { RawMaterialPurchaseIndent } from "@models/rawMaterialPurchaseIndent.modal";
import { PurchaseOrder } from "@models/purchaseOrder.model";
import { GENERALSTATUS } from "@common/constant.common";

export const getAllRequestQues = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        let pageValue = req.query.pageIndex ? parseInt(`${req.query.pageIndex}`) : 0;
        let limitValue = req.query.pageSize ? parseInt(`${req.query.pageSize}`) : 1000;
        pipeline.push(
            {
                $match: matchObj,
            },
            {
                $addFields: {
                    status: {
                        $cond: {
                            if: {
                                $in: [false, "$approvalArr.approvalStatus"],
                            },
                            then: "Pending",
                            else: "Approved",
                        },
                    },
                },
            },
            {
                $sort:{
                    createdAt:-1
                }
            },
            {
                $skip: pageValue * limitValue,
            },
            {
                $limit: limitValue,
            }
        );
        let RequestQuesArr = await RequestQues.aggregate(pipeline);
        res.status(201).json({
            message: "found all RequestQues",
            data: RequestQuesArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getRequestQuesById = async (req: any, res: any, next: any) => {
    try {
        let pipeline = [
                {
                  '$match': {
                    '_id':  new mongoose.Types.ObjectId(req.params.id), 
                    // 'approvalArr.approvalStatus': {
                    //   '$eq': false
                    // }
                  }
                }
        ];

        let existsCheck = await RequestQues.aggregate(pipeline);


        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("RequestQues does not exists");
        }
        res.status(201).json({
            message: "found all RequestQues",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};
export const updateRequestQuesById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck:any = await RequestQues.findOne({"_id":new mongoose.Types.ObjectId(req.params.id)}).lean().exec();
        if (!existsCheck) {
            throw new Error("RequestQues does not exists");
        }

        let approvalArr = []
        for (let i = 0; i < existsCheck.approvalArr.length; i++) {
            const element = existsCheck.approvalArr[i];
            if(element.approverId == req.user.userId){
                element.approvalStatus = true
            }
            approvalArr.push(element)
        }







        let RequestQuesObj = await RequestQues.findByIdAndUpdate(existsCheck._id,{approvalArr}, {new :true}).exec();
        
        if(!RequestQuesObj){
            throw new Error("Something went wrong while approving, please try again later and if the issue still persists then contact admin");
        }
        if(RequestQuesObj.approvalArr.every(el => el.approvalStatus == true) && existsCheck.requestPayload && existsCheck.requestPayload.origionalId && (existsCheck.requestType == REQUEST_TYPES.SALES_ORDER.ADD || existsCheck.requestType == REQUEST_TYPES.SALES_ORDER.UPDATE || existsCheck.requestType == REQUEST_TYPES.SALES_ORDER.DELETE )){
            await SalesOrder.findByIdAndUpdate(existsCheck.requestPayload?.origionalId, {approvalPending:false, status:GENERALSTATUS.APPROVED}).exec()
        }
        if(RequestQuesObj.approvalArr.every(el => el.approvalStatus == true) && existsCheck.requestPayload && existsCheck.requestPayload.origionalId && (existsCheck.requestType == REQUEST_TYPES.RAW_MATERIAL_PURCHASE_INDENT.ADD || existsCheck.requestType == REQUEST_TYPES.RAW_MATERIAL_PURCHASE_INDENT.UPDATE || existsCheck.requestType == REQUEST_TYPES.RAW_MATERIAL_PURCHASE_INDENT.DELETE )){
            await RawMaterialPurchaseIndent.findByIdAndUpdate(existsCheck.requestPayload?.origionalId, {approvalPending:false, status:GENERALSTATUS.APPROVED}).exec()
        }
        if(RequestQuesObj.approvalArr.every(el => el.approvalStatus == true) && existsCheck.requestPayload && existsCheck.requestPayload.origionalId && (existsCheck.requestType == REQUEST_TYPES.RAW_MATERIAL_PURCHASE_ORDER.ADD || existsCheck.requestType == REQUEST_TYPES.RAW_MATERIAL_PURCHASE_ORDER.UPDATE || existsCheck.requestType == REQUEST_TYPES.RAW_MATERIAL_PURCHASE_ORDER.DELETE )){
            await PurchaseOrder.findByIdAndUpdate(existsCheck.requestPayload?.origionalId, {approvalPending:false, status:GENERALSTATUS.APPROVED}).exec()
        }

        
        res.status(201).json({ message: "RequestQues Updated" });
    } catch (error) {
        next(error);
    }
};
