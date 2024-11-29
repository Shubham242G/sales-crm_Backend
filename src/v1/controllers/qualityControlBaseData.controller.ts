import mongoose from "mongoose";
import { QualityControlBaseData } from "@models/qualityControlBaseData.model";
import { addLogs } from "@helpers/addLog";


export const addQualityControlBaseData = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let existsCheck = await QualityControlBaseData.findOne({
            productId: new mongoose.Types.ObjectId(req.body.productId),
        }).exec();
        if (existsCheck) {
            throw new Error("Quality Control Base Data already exists for selected product");
        }
        await new QualityControlBaseData(req.body).save();
        // addLogs(
        //     "QualityControlBaseData added",
        //     "QualityControlBaseData",
        //     "QualityControlBaseData"
        // );
        res.status(201).json({ message: "QualityControlBaseData Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllQualityControlBaseData = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        let pageValue = req.query.pageIndex
            ? parseInt(`${req.query.pageIndex}`)
            : 0;
        let limitValue = req.query.pageSize
            ? parseInt(`${req.query.pageSize}`)
            : 1000;
        pipeline.push(
            {
                $match: matchObj,
            },
            {
                '$lookup': {
                  'from': 'products', 
                  'localField': 'productId', 
                  'foreignField': '_id', 
                  'as': 'productObj'
                }
              }, {
                '$unwind': {
                  'path': '$productObj', 
                  'preserveNullAndEmptyArrays': true
                }
              }, {
                '$addFields': {
                  'productName': '$productObj.name',
                  'productId': {
                    'label': '$productObj.name', 
                    'value': '$productId'
                }
                }
              },
            {
                $skip: pageValue * limitValue,
            },
            {
                $limit: limitValue,
            }
        );
        let QualityControlBaseDataArr = await QualityControlBaseData.aggregate(
            pipeline
        );
        res.status(201).json({
            message: "found all QualityControlBaseData",
            data: QualityControlBaseDataArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getQualityControlBaseDataById = async (
    req: any,
    res: any,
    next: any
) => {
    try {
      
        let pipeline = [
                {

                '$match':{
                    "_id":new mongoose.Types.ObjectId(req.params.id)
                },
            },

                {
                    '$lookup': {
                      'from': 'products', 
                      'localField': 'productId', 
                      'foreignField': '_id', 
                      'as': 'productObj'
                    }
                  }, 
                  {
                    '$unwind': {
                      'path': '$productObj', 
                      'preserveNullAndEmptyArrays': true
                    }
                  }, 
                  
                  {
                    '$addFields': {
                      'productName': '$productObj.name',
                      'productId': {
                        'label': '$productObj.name', 
                        'value': '$productId'
                    }
                    
                  }
                }
            

        ]


        let existsCheck = await QualityControlBaseData.aggregate(pipeline)
            
        if (existsCheck.length == 0) {
            throw new Error("Quality Control Base Data does not exists");
        }
        res.status(201).json({
            message: "found all Quality Control Base Data",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};
export const updateQualityControlBaseDataById = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let existsCheck = await QualityControlBaseData.findById(req.params.id)
            .lean()
            .exec();
        if (!existsCheck) {
            throw new Error("QualityControlBaseData does not exists");
        }

        addLogs("QualityControlBaseData updated", "QualityControlBaseData", "");
        let QualityControlBaseDataObj =
            await QualityControlBaseData.findByIdAndUpdate(
                req.params.id,
                req.body
            ).exec();
        res.status(201).json({ message: "QualityControlBaseData Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleteQualityControlBaseDataById = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let existsCheck = await QualityControlBaseData.findById(
            req.params.id
        ).exec();
        if (!existsCheck) {
            throw new Error("QualityControlBaseData does not exists");
        }
        let QualityControlBaseDataObj =
            await QualityControlBaseData.findByIdAndDelete(
                req.params.id
            ).exec();
        addLogs(
            "QualityControlBaseData removed",
            "QualityControlBaseData",
            "QualityControlBaseData"
        );
        res.status(201).json({ message: "QualityControlBaseData Deleted" });
    } catch (error) {
        next(error);
    }
};
