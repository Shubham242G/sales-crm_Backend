import { WorkOrder } from "@models/workOrder.model";
import { NextFunction, Request, Response } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";

export const addWorkOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await WorkOrder.findOne({ productId:new mongoose.Types.ObjectId(req.body.productId),salesOrderId:new mongoose.Types.ObjectId(req.body.salesOrderId) }).exec();
        if (existsCheck) {
            throw new Error("Work order already exists for the same sales order and product");
        }
        await new WorkOrder(req.body).save();
        res.status(201).json({ message: "Work order Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllWorkOrder = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        let WorkOrderArr = await paginateAggregate(WorkOrder, pipeline, req.query);
        res.status(201).json({ message: "found all Work order", data: WorkOrderArr.data, total: WorkOrderArr.total });
    } catch (error) {
        next(error);
    }
};


export const getForSelectInput = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push({
            $match: matchObj,
        });
        pipeline.push({
            '$project': {
              'label': {
                '$concat': [
                  '$productObj.name', ' to be delivered by ', '(', {
                    '$dateToString': {
                      'date': '$deliveryDate', 
                      'format': '%d-%m-%Y', 
                      'timezone': '+05:30'
                    }
                  }, ')', ' for ', '$customerObj.name'
                ]
              }, 
              'value': '$_id'
            }
          });
        let WorkOrderArr = await WorkOrder.aggregate(pipeline);
              res.status(201).json({ message: "found all Work order", data: WorkOrderArr });
    } catch (error) {
        next(error);
    }
};

export const getWorkOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            '$match':matchObj
        })

        
  pipeline.push(
        {
          '$unwind': {
            'path': '$productObj.stagesArr', 
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$addFields': {
            'stagesArr': '$productObj.stagesArr'
          }
        }, {
          '$addFields': {
            'stagesArr.machineId': {
              '$toObjectId': '$productObj.stagesArr.machineId'
            }
          }
        }, {
          '$lookup': {
            'from': 'machines', 
            'localField': 'stagesArr.machineId', 
            'foreignField': '_id', 
            'let': {
              'productId': '$productId'
            }, 
            'pipeline': [
              {
                '$lookup': {
                  'from': 'productwisemachinecapacities', 
                  'localField': '_id', 
                  'foreignField': 'machineId', 
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {
                          '$eq': [
                            '$productId', '$$productId'
                          ]
                        }
                      }
                    }
                  ], 
                  'as': 'capacityObj'
                }
              }, {
                '$unwind': {
                  'path': '$capacityObj', 
                  'preserveNullAndEmptyArrays': true
                }
              }, {
                '$addFields': {
                  'capacity': '$capacityObj.value'
                }
              }, {
                '$project': {
                  'capacityObj': 0
                }
              }
            ], 
            'as': 'stagesArr.machineObj'
          }
        }, {
          '$unwind': {
            'path': '$stagesArr.machineObj', 
            'preserveNullAndEmptyArrays': false
          }
        }, {
          '$group': {
            '_id': '$_id', 
            'customerId': {
              '$first': '$customerId'
            }, 
            'deliveryDate': {
              '$first': '$deliveryDate'
            }, 
            'salesOrderId': {
              '$first': '$salesOrderId'
            }, 
            'productId': {
              '$first': '$productId'
            }, 
            'finalWidth': {
              '$first': '$finalWidth'
            }, 
            'lengthOfRoll': {
              '$first': '$lengthOfRoll'
            }, 
            'numberOfRolls': {
              '$first': '$numberOfRolls'
            }, 
            'quantity': {
              '$first': '$quantity'
            }, 
            'rollWeight': {
              '$first': '$rollWeight'
            }, 
            'salesOrderQuantityWeight': {
              '$first': '$salesOrderQuantityWeight'
            }, 
            'workOrderQuantityWight': {
              '$first': '$workOrderQuantityWight'
            }, 
            'thickness': {
              '$first': '$thickness'
            }, 
            'soType': {
              '$first': '$soType'
            }, 
            'customerObj': {
              '$first': '$customerObj'
            }, 
            'bomObj': {
              '$first': '$bomObj'
            }, 
            'poObj': {
              '$first': '$poObj'
            }, 
            'productObj': {
              '$first': {
                '_id': {
                  '$toObjectId': '$productObj._id'
                }, 
                'name': '$productObj.name', 
                'productCode': '$productObj.productCode', 
                'customerProductCode': '$productObj.customerProductCode', 
                'hsnCode': '$productObj.hsnCode', 
                'PEFilmBasisWeight': '$productObj.PEFilmBasisWeight', 
                'thickness': '$productObj.thickness', 
                'thicknessMinValue': '$productObj.thicknessMinValue', 
                'thicknessMaxValue': '$productObj.thicknessMaxValue', 
                'finalWidth': '$productObj.finalWidth', 
                'widthTolleranceMin': '$productObj.widthTolleranceMin', 
                'widthTolleranceMax': '$productObj.widthTolleranceMax', 
                'rollDiameter': '$productObj.rollDiameter', 
                'noOfColors': '$productObj.noOfColors', 
                'designName': '$productObj.designName', 
                'pantoneColors': '$productObj.pantoneColors', 
                'repeatLength': '$productObj.repeatLength', 
                'repeatLengthMin': '$productObj.repeatLengthMin', 
                'repeatLengthMax': '$productObj.repeatLengthMax', 
                'laminationType': '$productObj.laminationType', 
                'nonWowenBasisWeight': '$productObj.nonWowenBasisWeight', 
                'corona': '$productObj.corona', 
                'finalPrintingDirection': '$productObj.finalPrintingDirection', 
                'finalUnwindingDirection': '$productObj.finalUnwindingDirection', 
                'lengthOfRoll': '$productObj.lengthOfRoll', 
                'coreDia': '$productObj.coreDia', 
                'slitWidth': '$productObj.slitWidth', 
                'slitWidthMin': '$productObj.slitWidthMin', 
                'slitWidthMax': '$productObj.slitWidthMax', 
                'productCategoryId': '$productObj.productCategoryId'
              }
            }, 
            'qcStagesArr': {
              '$first': '$qcStagesArr'
            }, 
            'stagesArr': {
              '$first': '$stagesArr'
            }, 
            'createdAt': {
              '$first': '$createdAt'
            }, 
            'updatedAt': {
              '$first': '$updatedAt'
            }, 
            'stageArr': {
              '$push': '$stagesArr'
            }
          }
        }
      
  )



    
        let existsCheck = await WorkOrder.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Work order does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Work order",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateWorkOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await WorkOrder.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Work order does not exists");
        }
        let Obj = await WorkOrder.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Work order Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteWorkOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await WorkOrder.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Work order does not exists or already deleted");
        }
        await WorkOrder.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Work order Deleted" });
    } catch (error) {
        next(error);
    }
};
