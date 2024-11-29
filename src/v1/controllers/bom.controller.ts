import { Bom } from "@models/bom.model";
import { BomStage, IBOM_STAGES } from "@models/bomStages.model";
import { Product } from "@models/product.model";
import { RawMaterials } from "@models/rawMaterials.model";
import { matchIgnoringSpacesRegex } from "../../util/regex";
import mongoose, { PipelineStage, Types } from "mongoose";
import XLSX from "xlsx";
import { STAGES } from "@common/constant.common";

export const addBom = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Bom.findOne({
            productId: req.body.productId,
        }).exec();
        
        if (existsCheck) {
            throw new Error("Bom for the selected product already exists.");
        }

        let bomObj = await new Bom(req.body).save();

        console.log(req.body.stageArr, "body");
        await BomStage.insertMany(req.body.stageArr.map((el: IBOM_STAGES) => ({ ...el, bomId: bomObj?._id })));
        // addLogs("Bom added", "Bom added", "Bom Added");
        res.status(201).json({ message: "Bom Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllBom = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [
                {
                    name: new RegExp(req.query.query, "i"),
                },
                {
                    "productId.label": new RegExp(req.query.query, "i"),
                },
            ];
        }
        let pageValue = req.query.pageIndex ? parseInt(`${req.query.pageIndex}`) : 0;
        let limitValue = req.query.pageSize ? parseInt(`${req.query.pageSize}`) : 1000;
        pipeline.push(
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "productObj",
                },
            },
            {
                $unwind: {
                    path: "$productObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    productId: {
                        label: "$productObj.name",
                        value: "$productObj._id",
                    },
                },
            },
            {
                $lookup: {
                    from: "bomstages",
                    localField: "_id",
                    foreignField: "bomId",
                    pipeline: [
                        {
                            $unwind: {
                                path: "$rawMaterialArr",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $lookup: {
                                from: "rawmaterialcategories",
                                localField: "rawMaterialArr.rawMaterialId",
                                foreignField: "_id",
                                as: "rawmaterialcategoryObj",
                            },
                        },
                        {
                            $unwind: {
                                path: "$rawmaterialcategoryObj",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $addFields: {
                                "rawMaterialArr.label": "$rawmaterialcategoryObj.name",
                                "rawMaterialArr.amount": { $toString: "$rawMaterialArr.count" },
                                "rawMaterialArr.value": "$rawmaterialcategoryObj._id",
                            },
                        },
                        {
                            $group: {
                                _id: "$_id",
                                bomId: {
                                    $first: "$bomId",
                                },
                                stageName: {
                                    $first: "$stageName",
                                },
                                label: {
                                    $first: "$stageName",
                                },
                                value: {
                                    $first: "$stageName",
                                },
                                rawMaterialArr: {
                                    $addToSet: "$rawMaterialArr",
                                },
                            },
                        },
                    ],
                    as: "stageArr",
                },
            },
            {
                $match: matchObj,
            },
            {
                $skip: pageValue * limitValue,
            },
            {
                $limit: limitValue,
            }
        );

        console.log(JSON.stringify(pipeline, null, 2));
        let BomArr = await Bom.aggregate(pipeline);
        res.status(201).json({ message: "found all Bom", data: BomArr });
    } catch (error) {
        next(error);
    }
};
export const getBomById = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [
            {
                $match: { _id: new mongoose.Types.ObjectId(req.params.id) },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "productObj",
                },
            },
            {
                $unwind: {
                    path: "$productObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    productId: {
                        label: "$productObj.name",
                        value: "$productObj._id",
                    },
                },
            },
            {
                $lookup: {
                    from: "bomstages",
                    localField: "_id",
                    foreignField: "bomId",
                    pipeline: [
                        {
                            $unwind: {
                                path: "$rawMaterialArr",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $lookup: {
                                from: "rawmaterials",
                                localField: "rawMaterialArr.rawMaterialId",
                                foreignField: "_id",
                                as: "rawmaterialObj",
                            },
                        },
                        {
                            $unwind: {
                                path: "$rawmaterialObj",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $addFields: {
                                "rawMaterialArr.label":{
                                    $concat: [
                                      "$rawmaterialObj.name",
                                      " (",
                                      "$rawmaterialObj.specification",
                                      ")"
                                    ]
                                  },
                                "rawMaterialArr.amount": {
                                    $toString: "$rawMaterialArr.count",
                                },
                                "rawMaterialArr.value": "$rawmaterialObj._id",
                            },
                        },
                        {
                            $group: {
                                _id: "$_id",
                                bomId: {
                                    $first: "$bomId",
                                },
                                stageName: {
                                    $first: "$stageName",
                                },
                                label: {
                                    $first: "$stageName",
                                },
                                value: {
                                    $first: "$stageName",
                                },
                                rawMaterialArr: {
                                    $addToSet: "$rawMaterialArr",
                                },
                            },
                        },
                        {
                            $addFields: {
                                stageOrder: {
                                    $switch: {
                                        branches: [
                                            { case: { $eq: ["$stageName", STAGES.EXTRUSION] }, then: 1 },
                                            { case: { $eq: ["$stageName", STAGES.PRINTING] }, then: 2 },
                                            { case: { $eq: ["$stageName", STAGES.LAMINATION] }, then: 3 },
                                            { case: { $eq: ["$stageName", STAGES.COATING] }, then: 4 },
                                            { case: { $eq: ["$stageName", STAGES.SLITTING] }, then: 5 },
                                            { case: { $eq: ["$stageName", STAGES.REWINDING] }, then: 6 },
                                        ],
                                        default: 7,
                                    },
                                },
                            },
                        },
                        {
                            $sort: { stageOrder: 1 },
                        },
                        {
                            $project: {
                                stageOrder: 0,
                            },
                        },
                    ],
                    as: "stageArr",
                },
            },
        ];

        console.log(JSON.stringify(pipeline, null, 2));

        let existsCheck = await Bom.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Bom does not exists");
        }
        res.status(201).json({
            message: "found all Bom",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};
export const updateBomById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Bom.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Bom does not exists");
        }
        let bomStageArr = req.body.stageArr;

        delete req.body.stageArr;
        // addLogs('Bom updated', "Bom ", );
        let BomObj = await Bom.findByIdAndUpdate(req.params.id, req.body).exec();

        let localBomStagesArr: string[] = [];
        for (let index = 0; index < bomStageArr.length; index++) {
            const element = bomStageArr[index];
            if (element.bomId && element.bomId != "") {
                let updateObj = {
                    ...element,
                };
                delete updateObj._id;
                localBomStagesArr.push(String(element._id));
                await BomStage.findOneAndUpdate({ bomId: element.bomId, _id: element._id }, updateObj).exec();
            } else {
                let localBomStageObj = await new BomStage({ ...element, stageName: element.label, bomId: req.params.id }).save();
                localBomStagesArr.push(String(localBomStageObj._id));
            }
        }
        let dbBomStages = await BomStage.find({ bomId: req.params.id }).exec();

        let stagesToBeDeleted = dbBomStages.filter((el:any) => !localBomStagesArr.some((ele) => `${ele}` == `${el._id}`));

        await BomStage.deleteMany({ _id: { $in: stagesToBeDeleted.map((el:any) => `${el._id}`) } }).exec();

        res.status(201).json({ message: "Bom Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleteBomById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Bom.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Bom does not exists");
        }
        let BomObj = await Bom.findByIdAndDelete(req.params.id).exec();
        await BomStage.deleteMany({ bomId: req.params.id }).exec();
        // addLogs(' removed', , );
        res.status(201).json({ message: "Bom Deleted" });
    } catch (error) {
        next(error);
    }
};

export const getBomForStockChecking = async (req: any, res: any, next: any) => {
    try {
        let pipeline:PipelineStage[] = [
            {
                $match: { _id: new mongoose.Types.ObjectId(req.params.id) },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "productObj",
                },
            },
            {
                $unwind: {
                    path: "$productObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    productId: {
                        label: "$productObj.name",
                        value: "$productObj._id",
                    },
                },
            },
            {
                $lookup: {
                    from: "bomstages",
                    localField: "_id",
                    foreignField: "bomId",
                    pipeline: [
                        {
                            $unwind: {
                                path: "$rawMaterialArr",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $lookup: {
                                from: "rawmaterialcategories",
                                localField: "rawMaterialArr.rawMaterialId",
                                foreignField: "_id",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: "rawmaterials",
                                            localField: "_id",
                                            foreignField: "rawMaterialId",
                                            as: "rawmaterialsArr",
                                        },
                                    },
                                ],
                                as: "rawmaterialcategoryObj",
                            },
                        },
                        {
                            $unwind: {
                                path: "$rawmaterialcategoryObj",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $addFields: {
                                "rawMaterialArr.label": "$rawmaterialcategoryObj.name",
                                "rawMaterialArr.rawmaterialsArr": "$rawmaterialcategoryObj.rawmaterialsArr",
                                "rawMaterialArr.amount": { $toString: "$rawMaterialArr.count" },
                                "rawMaterialArr.value": "$rawmaterialcategoryObj._id",
                            },
                        },
                        {
                            $group: {
                                _id: "$_id",
                                bomId: {
                                    $first: "$bomId",
                                },
                                stageName: {
                                    $first: "$stageName",
                                },
                                label: {
                                    $first: "$stageName",
                                },
                                value: {
                                    $first: "$stageName",
                                },
                                rawMaterialArr: {
                                    $addToSet: "$rawMaterialArr",
                                },
                            },
                        },
                        {
                            $addFields: {
                                stageOrder: {
                                    $switch: {
                                        branches: [
                                            { case: { $eq: ["$stageName", "EXTRUSION"] }, then: 1 },
                                            { case: { $eq: ["$stageName", "PRINTING"] }, then: 2 },
                                            { case: { $eq: ["$stageName", "LAMINATION"] }, then: 3 },
                                            { case: { $eq: ["$stageName", "COATING"] }, then: 4 },
                                            { case: { $eq: ["$stageName", "SLITTING"] }, then: 5 },
                                            { case: { $eq: ["$stageName", "REWINDING"] }, then: 6 },
                                        ],
                                        default: 7,
                                    },
                                },
                            },
                        },
                        {
                            $sort: { stageOrder: 1 },
                        },
                        {
                            $project: {
                                stageOrder: 0,
                            },
                        },
                    ],
                    as: "stageArr",
                },
            },
        ];

        let existsCheck = await Bom.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Bom does not exists");
        }
        res.status(201).json({ message: "Bom Deleted", data: existsCheck[0] });
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

        sheetNameList.forEach((sheetName:any) => {
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
        });

        let bomArr = await Bom.find({}).lean().exec();
        let bomStagesArr = await BomStage.find({}).lean().exec();
        let rawMaterialsArr = await RawMaterials.find({}).lean().exec();
        let productsArr = await Product.find({}).lean().exec();
        let countvalue = 0;
        // console.log(bomArr, "bomArr");
        // for (let index = 0; index < 31; index++) {
        for (let index = 0; index < xlData.length; index++) {
            let obj: any = {};
            const rowData = xlData[index];

            console.log(rowData,"rowData")
            if (rowData["Product name"]) obj.productName = rowData["Product name"].replace("\n", " ")
                .trim()
                .split(" ")
                .filter((el:any, index:number) => el != "")
                .join(" ");
            if (rowData["Stage name"]) obj.stageName = rowData["Stage name"]?.trim();
            if (rowData["Raw Material Name"]) obj.rawMaterialName = rowData["Raw Material Name"]?.trim();
            if (rowData["Specification"]) obj.specification = `${rowData["Specification"]}`?.trim();
            if (rowData["Unit of measurement"]) obj.unit = rowData["Unit of measurement"]?.trim();
            if (rowData["Value"]) obj.count = rowData["Value"];
            if (rowData["Buffer Stock"]) obj.scrapPercentage = rowData["Buffer Stock"] * 100;

            if(rowData['Raw Material Name'] && rowData['Raw Material Name']=="NA"){
                console.log("HERE",index)
                continue;
            }


            // console.log(rowData,"@@@",obj)
            // console.log(rowData["Buffer Stock"] *100, 'rowData["Buffer Stock"]')

            let productId: null | string = null;
            let bomId: null | string = null;
            // console.log(obj.productName, "obj.productName");
            let productIndex = productsArr.findIndex((el:any) => matchIgnoringSpacesRegex(el.name, obj.productName));
            if (productIndex !== -1) {
                productId = String(productsArr[productIndex]._id);
            }

            if (!productId) {
                throw new Error("Product not found !!!");
            }
            let bomIndex = bomArr.findIndex((el:any) => String(el.productId) == productId);

            if (bomIndex == -1) {
                let bomObj = await new Bom({ productId: productId }).save();
                bomId = String(bomObj._id);
                bomArr.push(bomObj);
            } else {
                bomId = String(bomArr[bomIndex]._id);
            }

            // console.log(productIndex, "productIndex", obj.productName, bomArr.length);
            let rawMaterialIndex = rawMaterialsArr.findIndex((el:any) => el?.specification?.toLowerCase()?.trim() == obj?.specification?.toLowerCase()?.trim());
            console.log(rawMaterialsArr.map(el => el.specification), obj.specification);
            console.log(rawMaterialIndex,"rawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndexrawMaterialIndex")
            // if (rawMaterialIndex != -1) {
            //     // countvalue = countvalue + 1;
            //     continue;
            // }
            
            // console.log(obj.count, Number(obj.count),"obj.count")
            
            let bomStageIndex = bomStagesArr.findIndex((el:any) => String(el.bomId) == bomId && el.stageName == obj.stageName);
            console.log(bomStageIndex, "bomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndexbomStageIndex")
            if (bomStageIndex != -1) {
                let rawMaterialIndex = rawMaterialsArr.findIndex((el:any) => el?.specification?.toLowerCase() == obj?.specification?.toLowerCase());
                console.log(rawMaterialIndex,"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! rawMaterialIndex werew !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",obj.specification);
                if (rawMaterialIndex != -1) {
                    let bomStageRawMaterialIndex = bomStagesArr[bomStageIndex].rawMaterialArr.findIndex((elx:any) => String(elx.rawMaterialId) == String(rawMaterialsArr[rawMaterialIndex]._id));
                    if (bomStageRawMaterialIndex == -1) {
                        let newBomStageUpdatedObj = await BomStage.findByIdAndUpdate(
                            bomStagesArr[bomStageIndex]._id,
                            {
                                $push: {
                                    rawMaterialArr: {
                                        rawMaterialId: rawMaterialsArr[rawMaterialIndex]._id,
                                        count: obj.count ? obj.count : 0,
                                        isPolymer: rawMaterialsArr[rawMaterialIndex].isPolymer,
                                        scrapPercentage: obj.scrapPercentage,
                                        unit: obj.unit,
                                        
                                    },
                                },
                            },
                            { new: true }
                        )
                            .lean()
                            .exec();

                        // console.log("here", newBomStageUpdatedObj?.rawMaterialArr.map(el => el.rawMaterialId))
                        if (newBomStageUpdatedObj) {
                            bomStagesArr[bomStageIndex] = newBomStageUpdatedObj;
                        }
                    }
                }
            } else {
                let rawMaterialIndex = rawMaterialsArr.findIndex((el:any) => el.specification.toLowerCase() == obj.specification.toLowerCase());
                if (rawMaterialIndex && rawMaterialIndex != -1) {
                    let newBomStageObj = await new BomStage({
                        bomId: bomId,
                        stageName: obj.stageName,
                        rawMaterialArr: [
                            {
                                rawMaterialId: rawMaterialsArr[rawMaterialIndex]._id,
                                count: obj.count ? obj.count : 0,
                                isPolymer: rawMaterialsArr[rawMaterialIndex].isPolymer,
                                scrapPercentage: obj.scrapPercentage,
                                unit: obj.unit,
                            },
                        ],
                    }).save();
                    bomStagesArr.push(newBomStageObj);
                } else {
                    let newBomStageObj = await new BomStage({
                        bomId: bomId,
                        stageName: obj.stageName,
                        rawMaterialArr: [],
                    }).save();
                    bomStagesArr.push(newBomStageObj);
                }
                // console.log(rawMaterialIndex,"rawMaterialIndex",obj.specification);
            }
            // console.log(bomStageIndex,"bomStageIndex")
        }

        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.log(error)
        console.error(error);
        next(error);
    }
};
