import { paginateAggregate } from "@helpers/paginateAggregate";
import { ProductCategories } from "@models/productCategories.model";
import { addLogs } from "@helpers/addLog";
import XLSX from "xlsx";

export const addProductCategories = async (req: any, res: any, next: any) => {
    try {
        if (!req.body.name || req.body.name == "") {
            throw new Error("Please add name !!!");
        }
        req.body.name = req.body.name.trim();
        let existsCheck = await ProductCategories.findOne({
            name: new RegExp(`^${req.body.name}$`, "i"),
        }).exec();
        if (existsCheck) {
            throw new Error("Product Category already exists");
        }
        await new ProductCategories(req.body).save();
        addLogs("Product Category added", req.body.name, req.body.name);
        res.status(201).json({ message: "Product Category Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllProductCategories = async (
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
        if (req.query.filmType && req.query.filmType != "") {
            matchObj.filmType = new RegExp(`^${req.query.filmType}$`, "i");
        }
        if (req.query.printedType && req.query.printedType != "") {
            matchObj.printedType = new RegExp(
                `^${req.query.printedType}$`,
                "i"
            );
        }
        if (req.query.laminationType && req.query.laminationType != "") {
            matchObj.laminationType = new RegExp(
                `^${req.query.laminationType}$`,
                "i"
            );
        }
        if (req.query.coatingType && req.query.coatingType != "") {
            matchObj.coatingType = new RegExp(
                `^${req.query.coatingType}$`,
                "i"
            );
        }

        pipeline.push({
            $match: matchObj,
        });

        let ProductCategoriesArr = await paginateAggregate(
            ProductCategories,
            pipeline,
            req.query
        );

        res.status(201).json({
            message: "found all Product Categories",
            data: ProductCategoriesArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllProductCategoriesForSelectInput = async (
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
        if (req.query.filmType && req.query.filmType != "") {
            matchObj.filmType = new RegExp(`^${req.query.filmType}$`, "i");
        }
        if (req.query.printedType && req.query.printedType != "") {
            matchObj.printedType = new RegExp(
                `^${req.query.printedType}$`,
                "i"
            );
        }
        if (req.query.laminationType && req.query.laminationType != "") {
            matchObj.laminationType = new RegExp(
                `^${req.query.laminationType}$`,
                "i"
            );
        }
        if (req.query.coatingType && req.query.coatingType != "") {
            matchObj.coatingType = new RegExp(
                `^${req.query.coatingType}$`,
                "i"
            );
        }

        pipeline.push(
            {
                $match: matchObj,
            },
            {
                $project: {
                    label: "$name",
                    value: "$_id",
                    _id: 0,
                },
            }
        );

        let ProductCategoriesArr = await ProductCategories.aggregate(pipeline);

        res.status(201).json({
            message: "found all Product Categories",
            data: ProductCategoriesArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getProductCategoriesById = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let existsCheck = await ProductCategories.findById(req.params.id)
            .lean()
            .exec();
        if (!existsCheck) {
            throw new Error("Product Categories does not exists");
        }
        res.status(201).json({
            message: "found all Product Categories",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const updateProductCategoriesById = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let existsCheck = await ProductCategories.findById(req.params.id)
            .lean()
            .exec();
        if (!existsCheck) {
            throw new Error("Product Categories does not exists");
        }

        console.log(req.body, "body")
        addLogs("Product Category updated", req.body.name, req.body.name);
        let ProductCategoriesObj = await ProductCategories.findByIdAndUpdate(
            req.params.id,
            req.body
        ).exec();
        res.status(201).json({ message: "Product Category Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteProductCategoriesById = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let existsCheck = await ProductCategories.findById(
            req.params.id
        ).exec();
        if (!existsCheck) {
            throw new Error("Product Categories does not exists");
        }
        let ProductCategoriesObj = await ProductCategories.findByIdAndDelete(
            req.params.id
        ).exec();
        addLogs("Product Category removed", req.body.name, req.body.name);
        res.status(201).json({ message: "Product Category Deleted" });
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

        for (let index = 0; index < xlData.length; index++) {
            let obj: any = {};
            const rowData = xlData[index];

            if (rowData["Name"]) obj.name = rowData["Name"].trim();
            if (rowData["FilmType"]) obj.filmType = rowData["FilmType"].trim();
            if (rowData["PrintedType"]) obj.printedType = rowData["PrintedType"].trim();
            if (rowData["LaminationType"]) obj.laminationType = rowData["LaminationType"].trim();
            if (rowData["CoatingType"]) obj.coatingType = rowData["CoatingType"].trim();

            console.log(obj, "obj")
            const existingProduct = await ProductCategories.findOne({ name: obj.name }).exec();
            if (existingProduct) {
                // Update logic if needed{}
                await ProductCategories.findOneAndUpdate({ name: existingProduct.name, obj }).exec();
            } else {
                await new ProductCategories(obj).save();
            }
        }

        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
