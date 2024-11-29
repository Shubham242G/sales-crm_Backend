import { paginateAggregate } from "@helpers/paginateAggregate";
import { RawMaterialCategories } from "@models/rawMaterialCategories.model";
import { addLogs } from "@helpers/addLog";
import { RequestHandler } from "express";
import { RawMaterialGroup } from "@models/RawMaterialGroup.model";
import { RawMaterials } from "@models/rawMaterials.model";
import XLSX from "xlsx";
import { STAGES } from "@common/constant.common";

export const addRawMaterialCategories = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterialCategories.findOne({
            name: new RegExp(`^${req.body.name}$`, "i"),
        }).exec();
        if (existsCheck) {
            throw new Error("Raw Material Category  already exists");
        }
        await new RawMaterialCategories(req.body).save();
        addLogs("Raw Material Category added", req.body.name, req.body.name);
        res.status(201).json({ message: "Raw Material Category Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllRawMaterialCategories = async (req: any, res: any, next: any) => {
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

        let RawMaterialCategoriesArr = await paginateAggregate(RawMaterialCategories, pipeline, req.query);

        res.status(201).json({
            message: "found all Product Categories",
            data: RawMaterialCategoriesArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getAllRawMaterialCategoriesForSelectInput = async (req: any, res: any, next: any) => {
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
        pipeline.push({
            $project: {
                label: "$name",
                value: "$_id",
                _id: 0,
            },
        });

        let RawMaterialCategoriesArr = await RawMaterialCategories.aggregate(pipeline);
        res.status(201).json({
            message: "found all Product Categories",
            data: RawMaterialCategoriesArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getRawMaterialCategoriesById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterialCategories.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Raw Material Category does not exists");
        }

        res.status(201).json({
            message: "found all RawMaterialCategories",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};
export const updateRawMaterialCategoriesById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterialCategories.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Raw Material Category does not exists");
        }

        addLogs("Raw Material Category updated", req.body.name, req.body.name);
        let RawMaterialCategoriesObj = await RawMaterialCategories.findByIdAndUpdate(req.params.id, req.body).exec();

        await RawMaterials.updateMany({ rawMaterialCategoryId: req.params.id }, { isPolymer: req.body.isPolymer }).exec();
        res.status(201).json({ message: "Raw Material Category Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleteRawMaterialCategoriesById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await RawMaterialCategories.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Raw Material Category does not exists");
        }
        let RawMaterialCategoriesObj = await RawMaterialCategories.findByIdAndDelete(req.params.id).exec();
        addLogs(" removed", req.body.name, req.body.name);
        res.status(201).json({ message: "Raw Material Category Deleted" });
    } catch (error) {
        next(error);
    }
};
export const bulkUpload = async (req: any, res: any, next: any) => {
    try {
        let rawMaterialTypeArr = ["RAW_MATERIAL", "PACKING_MATERIAL", "PROCESS_CONSUMABLE", "ENGINEERING_ITEMS", "GENERAL"];

        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetNameList = workbook.SheetNames;
        let xlData: any = [];

        sheetNameList.forEach((sheetName) => {
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
        });

        for (let index = 0; index < xlData.length; index++) {
            let obj: any = {};
            const rowData = xlData[index];

            if (rowData["Name"]) obj.name = rowData["Name"].trim();
            if (rowData["MaterialType Raw Material"]) obj.materialType = rawMaterialTypeArr.find((elx) => elx.toLowerCase() == `${rowData["MaterialType Raw Material"]}`.trim().replace(" ", "_").toLowerCase());
            if (rowData["Stage Name"]) obj.stageName = Object.keys(STAGES).find((elx) => elx.toLowerCase() == `${rowData["Stage Name"]}`.trim().toLowerCase());
            if (rowData["Raw Material Type "] == "POLYMER") {
                obj.isPolymer = true;
            } else {
                obj.isPolymer = false;
            }

            const existingProduct = await RawMaterialCategories.findOne({ stageName:obj.stageName,name: new RegExp(`^${obj.name}$`, "i") }).exec();
            if (existingProduct) {
                // Update logic if needed{}
                await RawMaterialCategories.findByIdAndUpdate(existingProduct._id,obj).exec();
            } else {
                await new RawMaterialCategories(obj).save();
            }
        }

        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
