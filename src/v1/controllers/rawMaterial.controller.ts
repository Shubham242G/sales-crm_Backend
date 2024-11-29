import { paginateAggregate } from "@helpers/paginateAggregate";
import { RawMaterials } from "@models/rawMaterials.model";
import { IRawMaterialCategories, RawMaterialCategories } from "@models/rawMaterialCategories.model";
import { addLogs } from "@helpers/addLog";
import mongoose from "mongoose";
import { RequestHandler } from "express";
import { RawMaterialGroup } from "@models/RawMaterialGroup.model";
import XLSX from "xlsx";

export const addRawMaterials = async (req: any, res: any, next: any) => {
    try {
        let objData = req.body;
        let existsCheck = await RawMaterials.findOne({
            name: new RegExp(`^${req.body.name}$`, "i"),
        }).exec();
        if (existsCheck) {
            throw new Error("Raw Material already exists");
        }
        await new RawMaterials(req.body).save();
        addLogs("Raw Material added", req.body.name, req.body.name);
        res.status(201).json({ message: "Raw Material Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllRawMaterials = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [{ name: new RegExp(req.query.query, "i") }, 
                { safeCoCode: new RegExp(req.query.query, "i") },
                { specification: new RegExp(req.query.query, "i") }
            ];
        }
        if (req.query.rawMaterialCategoryId && req.query.rawMaterialCategoryId != "") {
            matchObj.rawMaterialCategoryId = new mongoose.Types.ObjectId(req.query.rawMaterialCategoryId);
        }

        if (req.query.stage) {
            matchObj.stage = req.query.stage;
        }
        if (req.query.excludeSelf && req.query.rawMaterialId) {
            matchObj._id = { $ne: new mongoose.Types.ObjectId(req.query.rawMaterialId) };
        }

        pipeline.push({
            $match: matchObj,
        });

        pipeline.push(
            {
                $lookup: {
                    from: "rawmaterialcategories",
                    localField: "rawMaterialCategoryId",
                    foreignField: "_id",
                    as: "rawMaterialCategoryObj",
                },
            },
            {
                $unwind: {
                    path: "$rawMaterialCategoryObj",
                    preserveNullAndEmptyArrays: true,
                },
            }
        );
        if (req.query.isForSelectInput) {
            console.log(req.query.isForSelectInputWithSpecification,"req.query.isForSelectInputWithSpecification")
            if(req.query.isForSelectInputWithSpecification){
                pipeline.push({
                    $project: {
                        label: {$concat:["$name", " (","$specification", ")"]},
                        value: "$_id",
                    },
                });

            }
            else{

                pipeline.push({
                    $project: {
                        label: "$name",
                        value: "$_id",
                    },
                });
            }
        }
        let RawMaterialsArr = await paginateAggregate(RawMaterials, pipeline, req.query);

        res.status(201).json({
            message: "found all Product Categories",
            data: RawMaterialsArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getRawMaterialsById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck: any = await RawMaterials.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Raw Material does not exists");
        }

        let RawMaterialCategoriesObj = await RawMaterialCategories.findById(existsCheck.rawMaterialCategoryId).exec();
        if (RawMaterialCategoriesObj) {
            existsCheck.rawMaterialCategoryId = { label: RawMaterialCategoriesObj.name, value: RawMaterialCategoriesObj._id };
        }

        res.status(201).json({
            message: "found all RawMaterials",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};
export const updateRawMaterialsById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterials.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Raw Material does not exists");
        }

        addLogs("Raw Material updated", req.body.name, req.body.name);
        let RawMaterialsObj = await RawMaterials.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Raw Material Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleteRawMaterialsById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterials.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Raw Material does not exists");
        }
        let RawMaterialsObj = await RawMaterials.findByIdAndDelete(req.params.id).exec();
        addLogs(" removed", req.body.name, req.body.name);
        res.status(201).json({ message: "Raw Material Deleted" });
    } catch (error) {
        next(error);
    }
};

export const addRawMaterialGroup: RequestHandler = async (req, res, next) => {
    try {
        let existsCheck = await RawMaterialGroup.findOne({ outputRawMaterialId: req.body.outputRawMaterialId }).exec();
        if (existsCheck) {
            await RawMaterialGroup.findByIdAndUpdate(existsCheck._id, req.body).exec();
        } else {
            await new RawMaterialGroup(req.body).save();
        }
        res.status(201).json({ message: "Raw Material Group Updated" });
    } catch (error) {
        next(error);
    }
};

export const getRawMaterialGroupByOutputId: RequestHandler = async (req, res, next) => {
    try {
        let obj = await RawMaterialGroup.findOne({ outputRawMaterialId: req.params.id }).exec();
        if (!obj) throw new Error("Raw Material Group Not Found");
        res.status(200).json({ message: "Raw Material Group", data: obj });
    } catch (error) {
        next(error);
    }
};

export const getAllRawMaterialsForSelectInput = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }
        if (req.query.filmType && req.query.filmType != "") {
            matchObj.filmType = new RegExp(`^${req.query.filmType}$`, "i");
        }
        if (req.query.printedType && req.query.printedType != "") {
            matchObj.printedType = new RegExp(`^${req.query.printedType}$`, "i");
        }
        if (req.query.laminationType && req.query.laminationType != "") {
            matchObj.laminationType = new RegExp(`^${req.query.laminationType}$`, "i");
        }
        if (req.query.coatingType && req.query.coatingType != "") {
            matchObj.coatingType = new RegExp(`^${req.query.coatingType}$`, "i");
        }

        pipeline.push({
            $match: matchObj,
        });

        let projectObj: any = {
            label:{$concat:["$name", " (","$specification", ")"]},
            value: "$_id",
            _id: 0,
        };

        if (req.query.stageIncluded) {
            projectObj.stage = "$stage";
        }

        if (req.query.isPolymerIncluded) {
            projectObj.isPolymer = "$isPolymer";
        }

        pipeline.push({
            $project: projectObj,
        });

        let RawMaterialsArr = await RawMaterials.aggregate(pipeline);
        res.status(201).json({
            message: "found all Product Categories",
            data: RawMaterialsArr,
        });
    } catch (error) {
        next(error);
    }
};

export const bulkUpload = async (req: any, res: any, next: any) => {
    try {
        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetNameList = workbook.SheetNames;
        let xlData: any = [];

        sheetNameList.forEach((sheetName) => {
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
        });

        let rawMaterialArr = await RawMaterials.find().lean().exec();
        let RawMaterialCategoriesArr = await RawMaterialCategories.find().lean().exec();

        for (let index = 0; index < xlData.length; index++) {
            let obj: any = {};
            const rowData = xlData[index];
            console.log(rowData, "rowData");
            if (rowData["Name"]) obj.name = rowData["Name"].trim();
            if (rowData["SafeCo Code"]) obj.safeCoCode = rowData["SafeCo Code"].trim();
            if (rowData["Display Name"]) obj.displayName = rowData["Display Name"].trim() + " " + rowData["Specification"].trim();
            if (rowData["Specification"]) obj.specification = rowData["Specification"].trim();
            if (rowData["Material Type"]) obj.materialType = rowData["Material Type"].trim() + "D";
            // console.log(rowData['Raw Material \nCategory Name'])

            if (rowData["Raw Material \nCategory Name"]) {
                let rawMaterialCategoryObj = RawMaterialCategoriesArr.find((el: IRawMaterialCategories) => String(el.name)?.toLowerCase()?.trim() == String(rowData["Raw Material \nCategory Name"])?.toLowerCase()?.trim());
                if (rawMaterialCategoryObj) {
                    obj.rawMaterialCategoryId = rawMaterialCategoryObj._id;
                    obj.isPolymer = rawMaterialCategoryObj.isPolymer;
                    obj.stage = rawMaterialCategoryObj.stageName;
                } else {
                    console.log("Raw material not found");
                }
            }

            const existingProduct = await RawMaterials.findOne({ safeCoCode: obj.safeCoCode }).exec();
            if (existingProduct) {
                // Update logic if needed{}
                // await RawMaterials.findOneAndUpdate({ safeCoCode: existingProduct.safeCoCode, obj }).exec();
            } else {
                await new RawMaterials(obj).save();
            }
            console.log(obj);
        }

        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const bulkUploadRawMaterialsQC = async (req: any, res: any, next: any) => {
    try {
        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetNameList = workbook.SheetNames;
        let xlData: any = [];
        sheetNameList.forEach((sheetName) => {
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
        });

        let rawMaterialsArr = await RawMaterials.find().lean().exec();

        let mainArr: {
            rawMaterialId: string;
            rawMaterialName: string;
            specification: string;
            parametersArr: {
                name: string;
                value: string;
                unit: string;
                minvalue: number;
                maxvalue: number;
            }[];
        }[] = [];
        for (let index = 0; index < xlData.length; index++) {
            let obj: any = {};

            const rowData = xlData[index];
            if (rowData["Name"]) obj.rawMaterialName = rowData["Name"];
            if (rowData["Specification"]) obj.specification = rowData["Specification"];
            if (rowData["test name"]) obj.name = rowData["test name"].trim();
            if (rowData["unit"]) obj.unit = rowData["unit"].trim();
            if (String(rowData["minvalue"])) obj.minvalue = rowData["minvalue"];
            if (String(rowData["maxvalue"])) obj.maxvalue = rowData["maxvalue"];
            if (String(rowData["value"])) obj.value = rowData["value"] ? rowData["value"] : "";

            let nameRegexp = new RegExp(String(obj.rawMaterialName).trim().split("\n").join("").split(" ").join("").split("(").join("\\(").split(")").join("\\)"), "i");
            let specificationRegexp = new RegExp(String(obj.specification).trim().split("\n").join("").split(" ").join("").split("(").join("\\(").split(")").join("\\)"), "i");

            let rawMaterialIndex = rawMaterialsArr.findIndex((el) => nameRegexp.test(el.name.split("\n").join("").split(" ").join("")) && specificationRegexp.test(el.specification.split("\n").join("").split(" ").join("")));
            if (rawMaterialIndex == -1) {
                continue;
            }
            let rawMaterialMainIndex = mainArr.findIndex((el) => nameRegexp.test(el.rawMaterialName.split("\n").join("").split(" ").join("")) && specificationRegexp.test(el.specification.split("\n").join("").split(" ").join("")));
            if (rawMaterialMainIndex != -1) {
                mainArr[rawMaterialMainIndex].parametersArr.push({
                    name: obj.name,
                    value: obj.value,
                    unit: obj.unit,
                    minvalue: obj.minvalue,
                    maxvalue: obj.maxvalue,
                });
            } else {
                // console.log(rawMaterialsArr[rawMaterialIndex],"rawMaterialIndex")
                mainArr.push({
                    rawMaterialId: String(rawMaterialsArr[rawMaterialIndex]._id),
                    rawMaterialName: obj.rawMaterialName,
                    specification: obj.specification,
                    parametersArr: [
                        {
                            name: obj.name,
                            value: obj.value ?obj.value: "",
                            unit: obj.unit,
                            minvalue: obj.minvalue,
                            maxvalue: obj.maxvalue,
                        },
                    ],
                });
            }
        }

        for (let index = 0; index < mainArr.length; index++) {
            const element = mainArr[index];
            await RawMaterials.findByIdAndUpdate(element.rawMaterialId, { $push: { parametersArr: element.parametersArr } }).exec();
        }

        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
