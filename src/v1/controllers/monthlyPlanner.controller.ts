import { NextFunction, Request, Response, RequestHandler } from "express";
import { paginateAggregate } from "@helpers/paginateAggregate";
import mongoose, { PipelineStage } from "mongoose";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { MonthlyPlanner } from "@models/monthlyPlanner.model";
import { Enquiry } from "@models/enquiry.model";
import { Rfp } from "@models/rfp.model";
import { last } from "lodash";
import { SalesContact } from "@models/salesContact.model";
import XLSX from "xlsx";
import path from 'path'
import ExcelJs from "exceljs";





export const addMonthlyPlanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // let existsCheck = await MonthlyPlanner.findOne({ name: req.body.phone }).exec();
        // if (existsCheck) {
        //     throw new Error("MonthlyPlanner with same email already exists");
        // }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     console.log("first", req.body.imagesArr)
        //     for (const el of req.body.imagesArr) {
        //         if (el.image && el.image !== "") {
        //             el.image = await storeFileAndReturnNameBase64(el.image);
        //         }
        //     }
        // }

        console.log(
            "check 2 ", "for check MonthlyPlanner"
        )
        const meeting = await new MonthlyPlanner(req.body).save();
        res.status(201).json({ message: "MonthlyPlanner Created" });


    } catch (error) {
        next(error);
    }
};

export const getAllMonthlyPlanner = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push(
            {
                $match: matchObj,
            }
        );
        if (req?.query?.isForSelectInput) {
            pipeline.push({
                $project: {
                    label: { $concat: ["$firstName", " ", "$lastName"] },
                    value: "$_id"
                },
            })
        }
        let MonthlyPlannerArr = await paginateAggregate(MonthlyPlanner, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: MonthlyPlannerArr.data, total: MonthlyPlannerArr.total });
    } catch (error) {
        next(error);
    }
};

export const getMonthlyPlannerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.params.id) {
            matchObj._id = new mongoose.Types.ObjectId(req.params.id);
        }
        pipeline.push({
            $match: matchObj,
        });
        let existsCheck = await MonthlyPlanner.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("MonthlyPlanner does not exists");
        }
        existsCheck = existsCheck[0];
        res.status(201).json({
            message: "found specific Contact",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateMonthlyPlannerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await MonthlyPlanner.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("MonthlyPlanner does not exists");
        }

        // if (req.body.imagesArr && req.body.imagesArr.length > 0) {
        //     for (const el of req.body.imagesArr) {
        //         if (el.images && el.images !== "" && el.images.includes("base64")) {
        //             el.images = await storeFileAndReturnNameBase64(el.images);
        //         }
        //     }
        // }
        let Obj = await MonthlyPlanner.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "MonthlyPlanner Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteMonthlyPlannerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await MonthlyPlanner.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("MonthlyPlanner does not exists or already deleted");
        }
        await MonthlyPlanner.findByIdAndDelete(req.params.id).exec();
        res.status(201).json({ message: "MonthlyPlanner Deleted" });
    } catch (error) {
        next(error);
    }
};


export const getMonthlyPlannerByDate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.date) {
            matchObj.date = req.query.date;
        }
        pipeline.push(
            {
                $match: matchObj,
            }
        );
        let MonthlyPlannerArr = await paginateAggregate(MonthlyPlanner, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: MonthlyPlannerArr.data, total: MonthlyPlannerArr.total });
    } catch (error) {
        next(error);
    }
};

export const BulkUploadMonthlyPlanner: RequestHandler = async (req, res, next) => {



    try {
        let xlsxFile: any = req.file?.path;
        if (!xlsxFile) throw new Error("File Not Found");

        // Read the Excel file
        let workbook = XLSX.readFile(xlsxFile);
        let sheet_nameList = workbook.SheetNames;

        let xlData: any = [];
        sheet_nameList.forEach((element: any) => {
           
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[element]));
        });

        if (xlData && xlData.length > 0) {
            xlData.map(async (el: any) => await new MonthlyPlanner(el).save())
        }
        res.status(200).json({ message: "File Uploaded Successfully" });
   
    } catch (error) {
        next(error);
    }
}




// export const getAllMonthlyPlannerName = async (req: any, res: any, next: any) => {
//     try {
//         let MonthlyPlanners = await MonthlyPlanner.find(
//             {},
//             { firstName: 1, lastName: 1, _id: 0 }
//         ).lean();


//         let MonthlyPlannerNames = MonthlyPlanners.map((v: any) => ({
//             fullName: `${v.firstName} ${v.lastName}`.trim(),
//         }));


//         res.status(200).json({
//             message: "Found all MonthlyPlanners names",
//             data: MonthlyPlannerNames,
//             total: MonthlyPlannerNames.length,
//         });
//     } catch (error) {
//         console.log(error, "ERROR")
//         next(error);
//     }

// };


export const getAllMonthlyPlannerName = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [];
        let matchObj: Record<string, any> = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        pipeline.push(
            {
                $match: matchObj,
            }
        );

        let MonthlyPlannerArr = await paginateAggregate(MonthlyPlanner, pipeline, req.query);

        res.status(201).json({ message: "found all Device", data: MonthlyPlannerArr.data, total: MonthlyPlannerArr.total });
    } catch (error) {
        next(error);
    }
};