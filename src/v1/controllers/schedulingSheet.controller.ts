import { paginateAggregate } from "@helpers/paginateAggregate";
import { ISchedulingSheet, SchedulingSheet } from "@models/schedulingSheet.model";
import { NextFunction, Request, Response } from "express";
import moment from "moment";
import mongoose, { PipelineStage } from "mongoose";
import { getSchedulingSheetDataBetweenDates } from "../../builders/schedulingSheet.builder";
import { generateDateRange, returnUTCDate } from "@helpers/dateRangeGenerator";
import { Machines } from "@models/machines.model";

type Tmachine = {
    name: string;
    machineId:string;
    schedule: ISchedulingSheet | null | undefined;
};

export const addSchedulingSheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // console.log(JSON.stringify(req.body[0], null, 2));

        let existsArr = [];
        let existCount = 0;
        let uploadArr = [];
        for (let index = 0; index < req.body.length; index++) {
            const element = req.body[index];

            let startDate = new Date(element.stageWise[0].scheduledDate);
            startDate.setHours(0, 0, 0, 0);
            let endDate = new Date(element.stageWise.at(-1).scheduledDate);
            endDate.setHours(23, 59, 59, 59);
            let matchObj = {
                scheduledDate: { $gte: startDate, $lte: endDate },
                "productIdArr.productId": new mongoose.Types.ObjectId(element.productId),
            };

            let pipeline = getSchedulingSheetDataBetweenDates(matchObj);
            let ExisitingData = await SchedulingSheet.aggregate(pipeline);
            for (let index = 0; index < element.stageWise.length; index++) {
                const el = element.stageWise[index];
                let schedulingSheetObjExists = ExisitingData.find((ele) => moment(ele.scheduledDate).format("DD-MM-YYYY") == moment(el.scheduledDate).format("DD-MM-YYYY") && ele.machineId.toString() == el.machineId);

                if (schedulingSheetObjExists) {
                    if (schedulingSheetObjExists.hoursUsed == 24) {
                        let clashingStartDate = new Date(el.scheduledDate);
                        clashingStartDate.setHours(0, 0, 0, 0);

                        await SchedulingSheet.updateMany({ scheduledDate: { $gte: clashingStartDate }, machineId: schedulingSheetObjExists.machineId }, [
                            {
                                $set: {
                                    scheduledDate: {
                                        $dateAdd: {
                                            startDate: "$scheduledDate",
                                            unit: "day",
                                            amount: 1,
                                        },
                                    },
                                },
                            },
                        ]).exec();
                    } else if (schedulingSheetObjExists.hoursUsed > 0 && schedulingSheetObjExists.hoursUsed < 24) {
                        let clashingStartDate = new Date(schedulingSheetObjExists.scheduledDate);
                        clashingStartDate.setHours(0, 0, 0, 0);

                        let forwardDateSchedulesArr = await SchedulingSheet.find({ scheduledDate: { $gte: clashingStartDate }, machineId: schedulingSheetObjExists.machineId }).exec();

                        // Add new operation to the first day
                        schedulingSheetObjExists.productIdArr.unshift({ ...el });

                        for (let dayIndex = 0; dayIndex < forwardDateSchedulesArr.length; dayIndex++) {
                            let totalHoursUsed = 0;

                            for (let i = 0; i < forwardDateSchedulesArr[dayIndex].productIdArr.length; i++) {
                                let product: any = forwardDateSchedulesArr[dayIndex].productIdArr[i];

                                if (totalHoursUsed + product.hoursUsed > 24) {
                                    let remainingHours = 24 - totalHoursUsed;
                                    let overflowHours = product.hoursUsed - remainingHours;
                                    product.hoursUsed = remainingHours;
                                    product.quantity = remainingHours * product.hourlyCapacity;
                                    
                                    if (dayIndex < forwardDateSchedulesArr.length - 1) {
                                        console.log("herer")
                                        forwardDateSchedulesArr[dayIndex + 1].productIdArr.unshift({
                                            productId: product.productId,
                                            hoursUsed: overflowHours,
                                            quantity: overflowHours * product.hourlyCapacity,
                                            hourlyCapacity: product.hourlyCapacity,
                                            dailyCapacity: product.dailyCapacity,
                                        });
                                    } else {
                                        await new SchedulingSheet({
                                            scheduledDate: new Date(new Date(forwardDateSchedulesArr[dayIndex].scheduledDate).getTime() + 24 * 60 * 60 * 1000).toISOString(),
                                            machineId: product.machineId,
                                            workOrderId: product.workOrderId,
                                            machinePosition: product.machinePosition,
                                            hoursUsed: overflowHours,
                                            productIdArr: [
                                                {
                                                    productId: product.productId,
                                                    hoursUsed: overflowHours,
                                                    quantity: overflowHours * product.hourlyCapacity,
                                                    hourlyCapacity: product.hourlyCapacity,
                                                    dailyCapacity: product.dailyCapacity,
                                                    _id: product._id,
                                                },
                                            ],
                                            __v: 0,
                                        }).save();
                                    }
                                    totalHoursUsed = 24;
                                } else {
                                    totalHoursUsed += product.hoursUsed;
                                }
                            }

                            forwardDateSchedulesArr[dayIndex].hoursUsed = totalHoursUsed;
                            await SchedulingSheet.updateOne(
                                { _id: forwardDateSchedulesArr[dayIndex]._id },
                                {
                                    $set: {
                                        hoursUsed: totalHoursUsed,
                                        productIdArr: forwardDateSchedulesArr[dayIndex].productIdArr,
                                        updatedAt: new Date().toISOString(),
                                    },
                                }
                            ).exec();
                        }
                    }
                } else {
                }
            }

            let localstagewiseArr = element.stageWise.map((el: any) => ({
                scheduledDate: el.scheduledDate,
                machineId: el.machineId,
                workOrderId: el.workOrderId,
                machinePosition: el.machinePosition,
                hoursUsed: el.hoursUsed,
                productIdArr: [
                    {
                        productId: element.productId,
                        quantity: el.quantity,
                        hourlyCapacity: el.hourlyCapacity,
                        hoursUsed: el.hoursUsed,
                        dailyCapacity: el.dailyCapacity,
                    },
                ],
            }));

            await SchedulingSheet.insertMany(localstagewiseArr);

            // for (let index = 0; index < element.stageWise.length; index++) {
            //     const el = element.stageWise[index];
            //     let schedulingSheetObjExists: any = ExisitingData.find((ele) => moment(ele.scheduledDate).format("DD-MM-YYYY") == moment(el.scheduledDate).format("DD-MM-YYYY") && ele.machineId == el.machineId);
            //     if (schedulingSheetObjExists) {
            //         if (schedulingSheetObjExists.hoursUsed == 24) {
            //             let clashingStartDate = new Date(el.scheduledDate);
            //             clashingStartDate.setHours(0, 0, 0, 0);

            //             await SchedulingSheet.updateMany({ scheduledDate: { $gte: clashingStartDate }, machineId: schedulingSheetObjExists.machineId }, [
            //                 {
            //                     $set: {
            //                         scheduledDate: {
            //                             $dateAdd: {
            //                                 startDate: "$scheduledDate",
            //                                 unit: "day",
            //                                 amount: 1,
            //                             },
            //                         },
            //                     },
            //                 },
            //             ]).exec();
            //         } else if (schedulingSheetObjExists.hoursUsed > 0 && schedulingSheetObjExists.hoursUsed < 24) {
            //             let clashingStartDate = new Date(schedulingSheetObjExists.scheduledDate);
            //             clashingStartDate.setHours(0, 0, 0, 0);

            //             let forwardDateSchedulesArr = await SchedulingSheet.find({ scheduledDate: { $gte: clashingStartDate }, machineId: schedulingSheetObjExists.machineId }).exec();

            //             for (const elm of forwardDateSchedulesArr) {
            //                 console.log(elm, "elm");
            //             }

            //             console.log(schedulingSheetObjExists.hoursUsed, "schedulingSheetObjExists.hoursUsed", schedulingSheetObjExists);
            //         } else {
            //             console.log("here");
            //         }

            //     }

            // }
        }

        res.status(201).json({ message: "Scheduling Sheet Created" });
    } catch (error) {
        next(error);
    }
};

export const CheckSchedulingSheetDataExists = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsArr = [];
        let existCount = 0;
        let uploadArr = [];
        for (let index = 0; index < req.body.length; index++) {
            const element = req.body[index];

            let startDate = new Date(element.stageWise[0].scheduledDate);
            startDate.setHours(0, 0, 0, 0);
            let endDate = new Date(element.stageWise.at(-1).scheduledDate);
            endDate.setHours(23, 59, 59, 59);
            let matchObj = {
                scheduledDate: { $gte: startDate, $lte: endDate },
                "productIdArr.productId": new mongoose.Types.ObjectId(element.productId),
            };

            let pipeline = getSchedulingSheetDataBetweenDates(matchObj);
            let ExisitingData = await SchedulingSheet.aggregate(pipeline);
            for (let index = 0; index < element.stageWise.length; index++) {
                const el = element.stageWise[index];
                let schedulingSheetObjExists: any = ExisitingData.find((ele) => moment(ele.scheduledDate).format("DD-MM-YYYY") == moment(el.scheduledDate).format("DD-MM-YYYY") && ele.machineId == el.machineId);
                if (schedulingSheetObjExists) {
                    existCount++;
                    let localObj = {
                        ...schedulingSheetObjExists,
                        currentData: {
                            scheduledDate: el.scheduledDate,
                            machineId: el.machineId,
                            workOrderId: el.workOrderId,
                            machinePosition: el.machinePosition,
                            machineMaxQuantity: el.machineMaxQuantity,
                            hoursUsed: el.hoursUsed,
                            productIdArr: [
                                {
                                    productId: element.productId,
                                    hourlyCapacity: el.hourlyCapacity,
                                    hoursUsed: el.hoursUsed,
                                    dailyCapacity: el.dailyCapacity,
                                    productName: element.name,
                                    quantity: el.totalDailyProduction,
                                },
                            ],
                        },
                    };
                    existsArr.push(localObj);
                } else {
                    let localObj = {
                        scheduledDate: el.scheduledDate,
                        machineId: el.machineId,
                        workOrderId: el.workOrderId,
                        machinePosition: el.machinePosition,
                        machineMaxQuantity: el.machineMaxQuantity,
                        hoursUsed: el.hoursUsed,
                        productIdArr: [
                            {
                                productId: element.productId,
                                hourlyCapacity: el.hourlyCapacity,
                                hoursUsed: el.hoursUsed,
                                dailyCapacity: el.dailyCapacity,
                                productName: element.name,
                                quantity: el.totalDailyProduction,
                            },
                        ],
                    };
                    uploadArr.push(localObj);
                }
            }
        }

        if (existsArr && existsArr.length > 0) {
            res.status(206).json({ message: "Found clashing Scheduling Sheet data please review them once before proceeding", existsArr, data: req.body });
        } else {
            await SchedulingSheet.insertMany(uploadArr);
            res.status(201).json({ message: "No clashing Scheduling Sheet data found , Updated Scheduling sheet" });
        }
    } catch (error) {
        next(error);
    }
};

export const getAllSchedulingSheet = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }

        if (req.query.machineIdArr) {
            let matchMachineIdArr = JSON.parse(req.query.machineIdArr);
            matchMachineIdArr = matchMachineIdArr.map((el: string) => new mongoose.Types.ObjectId(el));
            matchObj.machineId = {
                $in: matchMachineIdArr,
            };
        }
        if (req.query.productId) {
            matchObj = { ...matchObj, "productIdArr.productId": new mongoose.Types.ObjectId(req.query.productId) };
        }
        pipeline.push({
            $match: matchObj,
        });

        pipeline.push(
            {
                $unwind: {
                    path: "$productIdArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $sort: {
                    scheduledDate: 1,
                },
            },
            {
                $group: {
                    _id: "$machineId",
                    machineId: {
                        $last: "$machineId",
                    },
                    scheduledDate: {
                        $last: "$scheduledDate",
                    },
                    machinePosition: {
                        $last: "$machinePosition",
                    },
                    productId: {
                        $last: "$productIdArr.productId",
                    },
                    quantity: {
                        $last: "$productIdArr.quantity",
                    },
                },
            },
            {
                $addFields: {
                    scheduledDate: {
                        $dateAdd: {
                            startDate: "$scheduledDate",
                            unit: "day",
                            amount: 1,
                        },
                    },
                },
            },
            {
                $sort: {
                    machinePosition: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    docs: {
                        $push: "$$ROOT",
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    docs: {
                        $reduce: {
                            input: "$docs",
                            initialValue: {
                                previousDate: null,
                                result: [],
                            },
                            in: {
                                previousDate: "$$this.scheduledDate",
                                result: {
                                    $concatArrays: [
                                        "$$value.result",
                                        [
                                            {
                                                $mergeObjects: [
                                                    "$$this",
                                                    {
                                                        scheduledDate: {
                                                            $cond: {
                                                                if: {
                                                                    $ne: ["$$value.previousDate", null],
                                                                },
                                                                then: {
                                                                    $dateAdd: {
                                                                        startDate: "$$value.previousDate",
                                                                        unit: "day",
                                                                        amount: 1,
                                                                    },
                                                                },
                                                                else: {
                                                                    $dateAdd: {
                                                                        startDate: "$$this.scheduledDate",
                                                                        unit: "day",
                                                                        amount: 1,
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        ],
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            {
                $unwind: "$docs",
            },
            {
                $replaceRoot: {
                    newRoot: "$docs",
                },
            },
            {
                $unwind: "$result",
            },
            {
                $project: {
                    previousDate: 0,
                },
            },
            {
                $replaceRoot: {
                    newRoot: "$result",
                },
            }
        );
        let SchedulingSheetArr = await paginateAggregate(SchedulingSheet, pipeline, req.query);
        res.status(201).json({ message: "found all Scheduling Sheet", data: SchedulingSheetArr.data, total: SchedulingSheetArr.total });
    } catch (error) {
        next(error);
    }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        let existsCheck = await SchedulingSheet.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Scheduling Sheet does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Scheduling Sheet",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await SchedulingSheet.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Scheduling Sheet does not exists");
        }
        let Obj = await SchedulingSheet.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Scheduling Sheet Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await SchedulingSheet.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Scheduling Sheet does not exists or already deleted");
        }
        await SchedulingSheet.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "Scheduling Sheet Deleted" });
    } catch (error) {
        next(error);
    }
};

export const getAllSchedulingSheetDataForSelectedDates = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];

        let matchObj: Record<string, any> = {};
        let startDate: Date = new Date();
        let endDate: Date = new Date();
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }

        if (req.query.machineIdArr) {
            let matchMachineIdArr = JSON.parse(req.query.machineIdArr);

            matchMachineIdArr = matchMachineIdArr.map((el: string) => new mongoose.Types.ObjectId(el));

            matchObj.machineId = {
                $in: matchMachineIdArr,
            };
        }
        if (req.query.productId) {
            matchObj = { ...matchObj, "productIdArr.productId": new mongoose.Types.ObjectId(req.query.productId) };
        }

        if (req.query.startDate && req.query.startDate != "" && req.query.endDate && req.query.endDate != "") {
            startDate = new Date(req.query.startDate);
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(req.query.endDate);
            endDate.setHours(23, 59, 59, 59);

            matchObj = { ...matchObj, scheduledDate: { $gte: startDate, $lte: endDate } };
            console.log("here");
        }

        let machinesArr = await Machines.find({}).lean().exec();
        let dateRange = generateDateRange(startDate, endDate);

        pipeline.push({
            $match: matchObj,
        });

        pipeline.push(
            {
                '$unwind': {
                    'path': '$productIdArr', 
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'products', 
                    'localField': 'productIdArr.productId', 
                    'foreignField': '_id', 
                    'pipeline': [
                        {
                            '$project': {
                                'name': 1, 
                                '_id': 0
                            }
                        }
                    ], 
                    'as': 'productObj'
                }
            }, {
                '$unwind': {
                    'path': '$productObj', 
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$addFields': {
                    'productIdArr.name': '$productObj.name'
                }
            }, {
                '$project': {
                    'productObj': 0
                }
            }, {
                '$group': {
                    '_id': '$_id', 
                    'scheduledDate': {
                        '$first': '$scheduledDate'
                    }, 
                    'machineId': {
                        '$first': '$machineId'
                    }, 
                    'workOrderId': {
                        '$first': '$workOrderId'
                    }, 
                    'machinePosition': {
                        '$first': '$machinePosition'
                    }, 
                    'hoursUsed': {
                        '$first': '$hoursUsed'
                    }, 
                    'productIdArr': {
                        '$addToSet': '$productIdArr'
                    }, 
                    'createdAt': {
                        '$first': '$createdAt'
                    }, 
                    'updatedAt': {
                        '$first': '$updatedAt'
                    }
                }
            },
            {
                $sort: {
                    scheduledDate: 1,
                },
            }
        );

        let SchedulingSheetArr = await SchedulingSheet.aggregate(pipeline);


        let finalArr = [];
        let scheduleIndex = -1
        for (let dateIndex = 0; dateIndex < dateRange.length; dateIndex++) {
            const element = dateRange[dateIndex];
            let localObj: { scheduledDate: string; machinesArr: Tmachine[] } = { scheduledDate: element, machinesArr: [] };

            for (let machineIndex = 0; machineIndex < machinesArr.length; machineIndex++) {
                const machine = machinesArr[machineIndex];

                scheduleIndex = SchedulingSheetArr.findIndex((el: ISchedulingSheet) => ((returnUTCDate(el.scheduledDate).toISOString().split("T")[0] == element) && (String(el.machineId) === String(machine._id))));
                let localMachineObj: Tmachine = { name: machine.name,machineId:String(machine._id), schedule: undefined };
                /////found
                if (scheduleIndex !== -1) {
                    localMachineObj.schedule = SchedulingSheetArr[scheduleIndex];
                }
                else{
                    // localMachineObj.schedule = 
                }
                localObj.machinesArr.push(localMachineObj);
            }
         

            // for (let productIndex = 0; productIndex < SchedulingSheetArr[scheduleIndex].productIdArr.length; productIndex++) {
            //     const element = SchedulingSheetArr[scheduleIndex].[productIndex];
                
            // }

            const hasNoSchedules = localObj.machinesArr.every((machine) => !machine.schedule);
            if (hasNoSchedules) {
                finalArr.push(localObj);
            }else{
                finalArr.push(localObj);
            }

         
        }

        res.status(201).json({ message: "found all Scheduling Sheet", data: finalArr, machinesArr });
    } catch (error) {
        next(error);
    }
};
