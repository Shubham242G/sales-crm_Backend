import mongoose from "mongoose";
import { Product } from "@models/product.model";
import { ProductCategories } from "@models/productCategories.model";
import { paginateAggregate } from "@helpers/paginateAggregate";
import { addLogs } from "@helpers/addLog";
import XLSX from "xlsx";
import { Customer } from "@models/customer.model";
import { Machines } from "@models/machines.model";

export const addProducts = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Product.findOne({
            name: new RegExp(`^${req.body.name}$`, "i"),
        }).exec();
        if (existsCheck) {
            throw new Error("Product already exists");
        }
        await new Product(req.body).save();
        addLogs("Product added", req.body.name, req.body.productCode);
        res.status(201).json({ message: "Product Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllProducts = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [{ name: new RegExp(req.query.query, "i") }, { productCode: new RegExp(req.query.query, "i") }, { customerProductCode: new RegExp(req.query.query, "i") }];
        }
        if (req.query.customerId && req.query.customerId != "") {
            matchObj.customerId = new mongoose.Types.ObjectId(req.query.customerId);
        }
        if (req.query.productCategoryId && req.query.productCategoryId != "") {
            matchObj.productCategoryId = new mongoose.Types.ObjectId(req.query.productCategoryId);
        }
        if (req.query.stagesArr && req.query.stagesArr.length != "") {
            matchObj = {
                ...matchObj,
                "stagesArr.machineId": {
                    $in: [...req.query.stagesArr.split(",").map((el: string) => new mongoose.Types.ObjectId(el))],
                },
            };
        }

        pipeline.push({
            $match: matchObj,
        });

        pipeline.push(
            {
                $unwind: {
                    path: "$stagesArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "machines",
                    localField: "stagesArr.machineId",
                    foreignField: "_id",
                    as: "stageObj",
                },
            },
            {
                $unwind: {
                    path: "$stageObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "productcategories",
                    localField: "productCategoryId",
                    foreignField: "_id",
                    as: "productCategoryObj",
                },
            },
            {
                $unwind: {
                    path: "$productCategoryObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerObj",
                },
            },
            {
                $unwind: {
                    path: "$customerObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "stagesArr.label": "$stageObj.name",
                    "stagesArr.value": "$stageObj._id",
                    "customerId.label": "$customerObj.name",
                    "customerId.value": "$customerObj._id",
                    "productCategoryId.label": "$productCategoryObj.name",
                    "productCategoryId.value": "$productCategoryObj._id",
                },
            },
            {
                $group: {
                    _id: "$_id",
                    name: {
                        $first: "$name",
                    },
                    productCode: {
                        $first: "$productCode",
                    },
                    customerId: {
                        $first: "$customerId",
                    },
                    productCategoryId: {
                        $first: "$productCategoryId",
                    },
                    customerProductCode: {
                        $first: "$customerProductCode",
                    },
                    stagesArr: {
                        $addToSet: "$stagesArr",
                    },
                },
            }
        );
        let ProductsArr: any = await paginateAggregate(Product, pipeline, req.query);
        res.status(201).json({
            message: "found all Product Categories",
            data: ProductsArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getAllProductsForSelectInput = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [{ name: new RegExp(req.query.query, "i") }, { productCode: new RegExp(req.query.query, "i") }, { customerProductCode: new RegExp(req.query.query, "i") }];
        }
        if (req.query.customerId && req.query.customerId != "") {
            matchObj.customerId = new mongoose.Types.ObjectId(req.query.customerId);
        }
        if (req.query.productCategoryId && req.query.productCategoryId != "") {
            matchObj.productCategoryId = new mongoose.Types.ObjectId(req.query.productCategoryId);
        }
        if (req.query.stagesArr && req.query.stagesArr.length != "") {
            matchObj = {
                ...matchObj,
                "stagesArr.machineId": {
                    $in: [...req.query.stagesArr.split(",").map((el: string) => new mongoose.Types.ObjectId(el))],
                },
            };
        }

        pipeline.push({
            $match: matchObj,
        });

        let projectObj = {
            label: "$name",
            value: "$_id",
            _id: 0,
        };

        pipeline.push({
            $project: projectObj,
        });
        let ProductsArr = await Product.aggregate(pipeline);
        res.status(201).json({
            message: "found all Product Categories",
            data: ProductsArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getProductsById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck: any = await Product.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Product does not exists");
        }

        let pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id),
                },
            },
            {
                $unwind: {
                    path: "$stagesArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "machines",
                    localField: "stagesArr.machineId",
                    foreignField: "_id",
                    as: "stageObj",
                },
            },
            {
                $unwind: {
                    path: "$stageObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "productcategories",
                    localField: "productCategoryId",
                    foreignField: "_id",
                    as: "productCategoryObj",
                },
            },
            {
                $unwind: {
                    path: "$productCategoryObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerObj",
                },
            },
            {
                $unwind: {
                    path: "$customerObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "stagesArr.label": "$stageObj.name",
                    "stagesArr.value": "$stageObj._id",
                    "stagesArr.stage": "$stageObj.stage",
                    "stagesArr.category": "$stageObj.category",
                    "customerId.label": "$customerObj.name",
                    "customerId.value": "$customerObj._id",
                    "productCategoryId.label": "$productCategoryObj.name",
                    "productCategoryId.value": "$productCategoryObj._id",
                },
            },
            {
                $group: {
                    _id: "$_id",
                    name: {
                        $first: "$name",
                    },
                    productCode: {
                        $first: "$productCode",
                    },
                    customerId: {
                        $first: "$customerId",
                    },
                    productCategoryId: {
                        $first: "$productCategoryId",
                    },
                    customerProductCode: { $first: "$customerProductCode" },
                    thickness: { $first: "$thickness" },
                    thicknessMinValue: { $first: "$thicknessMinValue" },
                    hsnCode: { $first: "$hsnCode" },
                    thicknessMaxValue: { $first: "$thicknessMaxValue" },
                    laminationType: { $first: "$laminationType" },
                    corona: { $first: "$corona" },
                    safeCoCode: { $first: "$safeCoCode" },
                    rawMaterialCategoryId: { $first: "$rawMaterialCategoryId" },
                    pefilmbasiswidth: { $first: "$pefilmbasiswidth" },
                    pefilmmaxwidth: { $first: "$pefilmmaxwidth" },
                    rolllengthextruder: { $first: "$rolllengthextruder" },
                    rolllengthprinter: { $first: "$rolllengthprinter" },
                    numberofcoils: { $first: "$numberofcoils" },
                    rolllengthlamination: { $first: "$rolllengthlamination" },
                    gluedetail: { $first: "$gluedetail" },
                    rolllengthcoating: { $first: "$rolllengthcoating" },
                    finalcoillength: { $first: "$finalcoillength" },
                    papercorethicknessmin: { $first: "$papercorethicknessmin" },
                    papercorethicknessstd: { $first: "$papercorethicknessstd" },
                    papercorethicknessmax: { $first: "$papercorethicknessmax" },
                    minrollod: { $first: "$minrollod" },
                    stdrollod: { $first: "$stdrollod" },
                    maxrollod: { $first: "$maxrollod" },
                    papercoreidmin: { $first: "$papercoreidmin" },
                    papercoreidstd: { $first: "$papercoreidstd" },
                    papercoreidmax: { $first: "$papercoreidmax" },
                    jointsallowed: { $first: "$jointsallowed" },
                    palletspecification: { $first: "$palletspecification" },
                    rollsinpallet: { $first: "$rollsinpallet" },
                    basisweightmin: { $first: "$basisweightmin" },
                    basisweightstd: { $first: "$basisweightstd" },
                    basisweightmax: { $first: "$basisweightmax" },
                    filmType: { $first: "$filmType" },
                    stretchratio: { $first: "$stretchratio" },
                    surfacetensionmin: { $first: "$surfacetensionmin" },
                    surfacetensionstd: { $first: "$surfacetensionstd" },
                    surfacetensionmax: { $first: "$surfacetensionmax" },
                    embosstype: { $first: "$embosstype" },
                    embossingside: { $first: "$embossingside" },
                    printingside: { $first: "$printingside" },
                    opacity: { $first: "$opacity" },
                    gloss: { $first: "$gloss" },
                    hydroheadpressure: { $first: "$hydroheadpressure" },
                    wvtrmin: { $first: "$wvtrmin" },
                    wvtrstd: { $first: "$wvtrstd" },
                    wvtrmax: { $first: "$wvtrmax" },
                    tensilestrengthpeakmdmin: { $first: "$tensilestrengthpeakmdmin" },
                    tensilestrengthpeakmdstd: { $first: "$tensilestrengthpeakmdstd" },
                    tensilestrengthpeakmdmax: { $first: "$tensilestrengthpeakmdmax" },
                    tensilestrengthpeakcdmin: { $first: "$tensilestrengthpeakcdmin" },
                    tensilestrengthpeakcdstd: { $first: "$tensilestrengthpeakcdstd" },
                    tensilestrengthpeakcdmax: { $first: "$tensilestrengthpeakcdmax" },
                    elongationpeakmdmin: { $first: "$elongationpeakmdmin" },
                    elongationpeakmdstd: { $first: "$elongationpeakmdstd" },
                    elongationpeakmdmax: { $first: "$elongationpeakmdmax" },
                    elongationpeakcdmin: { $first: "$elongationpeakcdmin" },
                    elongationpeakcdstd: { $first: "$elongationpeakcdstd" },
                    elongationpeakcdmax: { $first: "$elongationpeakcdmax" },
                    printingInkArr: { $first: "$printingInkArr" },
                    repeatlengthwithouttensionstd: { $first: "$repeatlengthwithouttensionstd" },
                    repeatlengthwithouttensionmax: { $first: "$repeatlengthwithouttensionmax" },
                    slevesize: { $first: "$slevesize" },
                    printingdesignname: { $first: "$printingdesignname" },
                    printingunwindingdirection: { $first: "$printingunwindingdirection" },
                    nonwovenbasisweightmin: { $first: "$nonwovenbasisweightmin" },
                    nonwovenbasisweightstd: { $first: "$nonwovenbasisweightstd" },
                    nonwovenbasisweightmax: { $first: "$nonwovenbasisweightmax" },
                    thicknessmin: { $first: "$thicknessmin" },
                    thicknessstd: { $first: "$thicknessstd" },
                    thicknessmax: { $first: "$thicknessmax" },
                    widthmin: { $first: "$widthmin" },
                    widthstd: { $first: "$widthstd" },
                    widthmax: { $first: "$widthmax" },
                    length: { $first: "$length" },
                    bondingtestmdmin: { $first: "$bondingtestmdmin" },
                    bondingtestmdstd: { $first: "$bondingtestmdstd" },
                    bondingtestmdmax: { $first: "$bondingtestmdmax" },
                    bondingtestcdmin: { $first: "$bondingtestcdmin" },
                    bondingtestcdstd: { $first: "$bondingtestcdstd" },
                    bondingtestcdmax: { $first: "$bondingtestcdmax" },
                    laminatedfilmbasisweightmin: { $first: "$laminatedfilmbasisweightmin" },
                    laminatedfilmbasisweightstd: { $first: "$laminatedfilmbasisweightstd" },
                    laminatedfilmbasisweightmax: { $first: "$laminatedfilmbasisweightmax" },
                    laminationside: { $first: "$laminationside" },
                    laminationtype: { $first: "$laminationtype" },
                    hydroheadpressuremin: { $first: "$hydroheadpressuremin" },
                    hydroheadpressurestd: { $first: "$hydroheadpressurestd" },
                    hydroheadpressuremax: { $first: "$hydroheadpressuremax" },
                    stdrollodmin: { $first: "$stdrollodmin" },
                    stdrollodstd: { $first: "$stdrollodstd" },
                    stdrollodmax: { $first: "$stdrollodmax" },
                    stdrolllength: { $first: "$stdrolllength" },
                    corelengthstd: { $first: "$corelengthstd" },
                    corelengthmin: { $first: "$corelengthmin" },
                    corelengthmax: { $first: "$corelengthmax" },
                    shelflife: { $first: "$shelflife" },
                    finalct: { $first: "$finalct" },
                    finalunwindingdirection: { $first: "$finalunwindingdirection" },
                    packingtapetype: { $first: "$packingtapetype" },
                    connectiontype: { $first: "$connectiontype" },
                    halfjointconnection: { $first: "$halfjointconnection" },
                    noofconnectionrolls: { $first: "$noofconnectionrolls" },
                    slitWidth: {
                        $first: "$slitWidth",
                    },
                    slitWidthMin: {
                        $first: "$slitWidthMin",
                    },
                    productCategoryObj: {
                        $first: "$productCategoryObj",
                    },
                    slitWidthMax: {
                        $first: "$slitWidthMax",
                    },
                    stagesArr: {
                        $addToSet: "$stagesArr",
                    },
                    machineTypesArr: {
                        $addToSet: {
                            label: "$stagesArr.stage",
                            value: "$stagesArr.stage",
                        },
                    },
                },
            },
        ];

        let productCategoryIdObj = await Product.aggregate(pipeline).exec();
        if (productCategoryIdObj.length > 0) {
            productCategoryIdObj = productCategoryIdObj[0];
        }
        res.status(201).json({
            message: "found all Products",
            data: productCategoryIdObj,
        });
    } catch (error) {
        next(error);
    }
};
export const updateProductsById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Product.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Product does not exists");
        }

        addLogs("Product updated", req.body.name, req.params.id);
        let ProductsObj = await Product.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Product Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleteProductsById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Product.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Product does not exists");
        }
        let ProductsObj = await Product.findByIdAndDelete(req.params.id).exec();
        addLogs("Product removed", req.body.name, req.params.id);
        res.status(201).json({ message: "Product Deleted" });
    } catch (error) {
        next(error);
    }
};

export const bulkUpload = async (req: any, res: any, next: any) => {
    try {
        let workbook = XLSX.readFile(req.file.path);
        let sheet_nameList = workbook.SheetNames;
        let x = 0;
        let xlData: any = [];
        sheet_nameList.forEach((element) => {
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[sheet_nameList[x]]));
            x++;
        });

        let errorsArr = [];
        for (let index = 0; index < xlData.length; index++) {
            let obj: any = {};
            if (xlData[index]["Product code"]) {
                obj.productCode = `${xlData[index]["Product code"]}`
                    .replace("\n", " ")
                    .trim()
                    .split(" ")
                    .filter((el, index) => el != "")
                    .join(" ");
                obj.name = `${xlData[index]["Product code"]}`
                    .replace("\n", " ")
                    .trim()
                    .split(" ")
                    .filter((el, index) => el != "")
                    .join(" ");
            }
            if (xlData[index]["Product description"]) {
                obj.description = `${xlData[index]["Product description"]}`.trim();
            }
            if (xlData[index]["CustomerProductCode"] && xlData[index]["CustomerProductCode"] != "NA") {
                obj.customerProductCode = `${xlData[index]["CustomerProductCode"]}`.trim();
            }
            if (xlData[index]["HsnCode"] && xlData[index]["HsnCode"] != "NA") {
                obj.hsnCode = `${xlData[index]["HsnCode"]}`.trim();
            }
            if (xlData[index]["PEFilmWidth"] && xlData[index]["PEFilmWidth"] != "NA") {
                obj.pefilmbasiswidth = Number(`${xlData[index]["PEFilmWidth"]}`.trim());
            }
            if (xlData[index]["PEFilmWidth_1"] && xlData[index]["PEFilmWidth_1"] != "NA") {
                obj.pefilmmaxwidth = Number(`${xlData[index]["PEFilmWidth_1"]}`.trim());
            }
            if (xlData[index]["Roll Length\n(EXTRUDER)"]) {
                obj.rolllengthextruder = Number(`${xlData[index]["Roll Length\n(EXTRUDER)"]}`.trim());
            }
            if (xlData[index]["Roll Length\n(PRINTER)"]) {
                obj.rolllengthprinter = Number(`${xlData[index]["Roll Length\n(PRINTER)"]}`.trim());
            }
            if (xlData[index]["Number of Coils"] && xlData[index]["Number of Coils"] != 0) {
                obj.numberofcoilsone = Number(`${xlData[index]["Number of Coils"]}`.trim());
            }
            if (xlData[index]["Number of Coils_1"] && xlData[index]["Number of Coils_1"] != 0) {
                obj.numberofcoilstwo = Number(`${xlData[index]["Number of Coils_1"]}`.trim());
            }
            if (xlData[index]["Roll Length\n(LAMINATION)"] && xlData[index]["Roll Length\n(LAMINATION)"] != "NA") {
                obj.rolllengthlamination = Number(`${xlData[index]["Roll Length\n(LAMINATION)"]}`.trim());
            }
            if (xlData[index]["Glue Detail"] && xlData[index]["Glue Detail"] != "NA" && xlData[index]["Glue Detail"] != 0) {
                obj.gluedetail = `${xlData[index]["Glue Detail"]}`.trim();
            } else {
                obj.gluedetail = ``;
            }
            if (xlData[index]["Type of Lamination"] && xlData[index]["Type of Lamination"] != "NA" && xlData[index]["Type of Lamination"] != 0) {
                obj.laminationType = `${xlData[index]["Type of Lamination"]}`.trim();
            } else {
                obj.laminationType = ``;
            }
            if (xlData[index]["Roll Length\n(COATING)"] && xlData[index]["Roll Length\n(COATING)"] != "NA") {
                obj.rolllengthcoating = Number(`${xlData[index]["Roll Length\n(COATING)"]}`.trim());
            }
            if (xlData[index]["final coil length"] && xlData[index]["final coil length"] != "NA") {
                obj.finalcoillength = Number(`${xlData[index]["final coil length"]}`.trim());
            }
            if (xlData[index]["Paper Core Thickness MINIMUM"] && xlData[index]["Paper Core Thickness MINIMUM"] != "NA") {
                obj.papercorethicknessmin = Number(`${xlData[index]["Paper Core Thickness MINIMUM"]}`.trim());
            }
            if (xlData[index]["Paper Core Thickness STANDARD"] && xlData[index]["Paper Core Thickness STANDARD"] != "NA") {
                obj.papercorethicknessstd = Number(`${xlData[index]["Paper Core Thickness STANDARD"]}`.trim());
            }
            if (xlData[index]["Paper Core Thickness MAXIMUM"] && xlData[index]["Paper Core Thickness MAXIMUM"] != "NA") {
                obj.papercorethicknessmax = Number(`${xlData[index]["Paper Core Thickness MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Minimum Roll O.D"] && xlData[index]["Minimum Roll O.D"] != "NA") {
                obj.minrollod = Number(`${xlData[index]["Minimum Roll O.D"]}`.trim());
            }
            if (xlData[index]["Std Roll O.D"] && xlData[index]["Std Roll O.D"] != "NA") {
                obj.stdrollod = Number(`${xlData[index]["Std Roll O.D"]}`.trim());
            }
            if (xlData[index]["Maximum Roll O.D"] && xlData[index]["Maximum Roll O.D"] != "NA") {
                obj.maxrollod = Number(`${xlData[index]["Maximum Roll O.D"]}`.trim());
            }
            if (xlData[index]["Paper Core I.D"] && xlData[index]["Paper Core I.D"] != "NA") {
                obj.papercoreidmin = Number(`${xlData[index]["Paper Core I.D"]}`.trim());
            }
            if (xlData[index]["Paper Core I.D_1"] && xlData[index]["Paper Core I.D_1"] != "NA") {
                obj.papercoreidstd = Number(`${xlData[index]["Paper Core I.D_1"]}`.trim());
            }
            if (xlData[index]["Paper Core I.D_2"] && xlData[index]["Paper Core I.D_2"] != "NA") {
                obj.papercoreidmax = Number(`${xlData[index]["Paper Core I.D_2"]}`.trim());
            }
            if (xlData[index]["Joints Allowed"] && xlData[index]["Joints Allowed"] != "NA") {
                obj.jointsallowed = Number(`${xlData[index]["Joints Allowed"]}`.trim());
            }
            if (xlData[index]["Pallet Specification"] && xlData[index]["Pallet Specification"] != "NA") {
                obj.palletspecification = `${xlData[index]["Pallet Specification"]}`.trim();
            }
            if (xlData[index]["No of Roll In Pallet"] && xlData[index]["No of Roll In Pallet"] != "NA") {
                obj.rollsinpallet = Number(`${xlData[index]["No of Roll In Pallet"]}`.trim());
            }
            if (xlData[index]["Basis Weight MINIMUM"] && xlData[index]["Basis Weight MINIMUM"] != "NA") {
                obj.basisweightmin = Number(`${xlData[index]["Basis Weight MINIMUM"]}`.trim());
            }
            if (xlData[index]["Basis Weight STANDARD"] && xlData[index]["Basis Weight STANDARD"] != "NA") {
                obj.basisweightstd = Number(`${xlData[index]["Basis Weight STANDARD"]}`.trim());
            }
            if (xlData[index]["Basis Weight MAXIMUM"] && xlData[index]["Basis Weight MAXIMUM"] != "NA") {
                obj.basisweightmax = Number(`${xlData[index]["Basis Weight MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Type of Film"] && xlData[index]["Type of Film"] != "NA") {
                obj.filmType = `${xlData[index]["Type of Film"]}`.trim();
            }
            if (xlData[index]["Stretching Ratio"] && xlData[index]["Stretching Ratio"] != "NA") {
                obj.stretchratio = Number(`${xlData[index]["Stretching Ratio"]}`.trim());
            }
            if (xlData[index]["Thickness MINIMUM"] && xlData[index]["Thickness MINIMUM"] != "NA") {
                obj.thicknessMinValue = Number(`${xlData[index]["Thickness MINIMUM"]}`.trim());
            }
            if (xlData[index]["Thickness STANDARD"] && xlData[index]["Thickness STANDARD"] != "NA") {
                obj.thickness = Number(`${xlData[index]["Thickness STANDARD"]}`.trim());
            }
            if (xlData[index]["Thickness MAXIMUM"] && xlData[index]["Thickness MAXIMUM"] != "NA") {
                obj.thicknessMaxValue = Number(`${xlData[index]["Thickness MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Surface Tension MINIMUM"] && xlData[index]["Surface Tension MINIMUM"] != "NA") {
                obj.surfacetensionmin = Number(`${xlData[index]["Surface Tension MINIMUM"]}`.trim());
            }
            if (xlData[index]["Surface Tension STANDARD"] && xlData[index]["Surface Tension STANDARD"] != "NA") {
                obj.surfacetensionstd = Number(`${xlData[index]["Surface Tension STANDARD"]}`.trim());
            }
            if (xlData[index]["Surface Tension MAXIMUM"] && xlData[index]["Surface Tension MAXIMUM"] != "NA") {
                obj.surfacetensionmax = Number(`${xlData[index]["Surface Tension MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Corona side"] && xlData[index]["Corona side"] != "NA") {
                obj.corona = `${xlData[index]["Corona side"]}`.trim();
            }
            if (xlData[index]["Type of Emboss"] && xlData[index]["Type of Emboss"] != "NA") {
                obj.embosstype = `${xlData[index]["Type of Emboss"]}`.trim();
            }
            if (xlData[index]["Embossing side"] && xlData[index]["Embossing side"] != "NA") {
                obj.embossingside = `${xlData[index]["Embossing side"]}`.trim();
            }
            if (xlData[index]["Printing Side"] && xlData[index]["Printing Side"] != "NA") {
                obj.printingside = `${xlData[index]["Printing Side"]}`.trim();
            }
            if (xlData[index]["Opacity"] && xlData[index]["Opacity"] != "NA") {
                obj.opacity = `${xlData[index]["Opacity"]}`.trim();
            }
            if (xlData[index]["Gloss at 45 Degree (Silicon Side)"] && xlData[index]["Gloss at 45 Degree (Silicon Side)"] != "NA") {
                obj.gloss = `${xlData[index]["Gloss at 45 Degree (Silicon Side)"]}`.trim();
            }
            if (xlData[index]["Hydro Head Pressure"] && xlData[index]["Hydro Head Pressure"] != "NA") {
                obj.hydroheadpressure = `${xlData[index]["Hydro Head Pressure"]}`.trim();
            }
            if (xlData[index]["WVTR MINIMUM"] && xlData[index]["WVTR MINIMUM"] != "NA") {
                obj.wvtrmin = Number(`${xlData[index]["WVTR MINIMUM"]}`.trim());
            }
            if (xlData[index]["WVTR STANDARD"] && xlData[index]["WVTR STANDARD"] != "NA") {
                obj.wvtrstd = Number(`${xlData[index]["WVTR STANDARD"]}`.trim());
            }
            if (xlData[index]["WVTR MAXIMUM"] && xlData[index]["WVTR MAXIMUM"] != "NA") {
                obj.wvtrmax = Number(`${xlData[index]["WVTR MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(MD) MINIMUM"] && xlData[index]["Tensile Strength @ Peak\n(MD) MINIMUM"] != "NA") {
                obj.tensilestrengthpeakmdmin = Number(`${xlData[index]["Tensile Strength @ Peak\n(MD) MINIMUM"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(MD) STANDARD"] && xlData[index]["Tensile Strength @ Peak\n(MD) STANDARD"] != "NA") {
                obj.tensilestrengthpeakmdstd = Number(`${xlData[index]["Tensile Strength @ Peak\n(MD) STANDARD"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(MD) MAXIMUM"] && xlData[index]["Tensile Strength @ Peak\n(MD) MAXIMUM"] != "NA") {
                obj.tensilestrengthpeakmdmax = Number(`${xlData[index]["Tensile Strength @ Peak\n(MD) MAXIMUM"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(CD) MINIMUM"] && xlData[index]["Tensile Strength @ Peak\n(CD) MINIMUM"] != "NA") {
                obj.tensilestrengthpeakcdmin = Number(`${xlData[index]["Tensile Strength @ Peak\n(CD) MINIMUM"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(CD) STANDARD"] && xlData[index]["Tensile Strength @ Peak\n(CD) STANDARD"] != "NA") {
                obj.tensilestrengthpeakcdstd = Number(`${xlData[index]["Tensile Strength @ Peak\n(CD) STANDARD"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(CD) MAXIMUM"] && xlData[index]["Tensile Strength @ Peak\n(CD) MAXIMUM"] != "NA") {
                obj.tensilestrengthpeakcdmax = Number(`${xlData[index]["Tensile Strength @ Peak\n(CD) MAXIMUM"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Elongation @ Peak MINIMUM\n(MD)"] && xlData[index]["Elongation @ Peak MINIMUM\n(MD)"] != "NA") {
                obj.elongationpeakmdmin = Number(`${xlData[index]["Elongation @ Peak MINIMUM\n(MD)"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Elongation @ Peak STANDARD\n(MD)"] && xlData[index]["Elongation @ Peak STANDARD\n(MD)"] != "NA") {
                obj.elongationpeakmdstd = Number(`${xlData[index]["Elongation @ Peak STANDARD\n(MD)"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Elongation @ Peak MAXIMUM\n(MD)"] && xlData[index]["Elongation @ Peak MAXIMUM\n(MD)"] != "NA") {
                obj.elongationpeakmdmax = Number(`${xlData[index]["Elongation @ Peak MAXIMUM\n(MD)"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Elongation @ Peak MINIMUM\n(CD)"] && xlData[index]["Elongation @ Peak MINIMUM\n(CD)"] != "NA") {
                obj.elongationpeakcdmin = Number(`${xlData[index]["Elongation @ Peak MINIMUM\n(CD)"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Elongation @ Peak STANDARD\n(CD)"] && xlData[index]["Elongation @ Peak STANDARD\n(CD)"] != "NA") {
                obj.elongationpeakcdstd = Number(`${xlData[index]["Elongation @ Peak STANDARD\n(CD)"]}`.replace("›", "").trim());
            }
            if (xlData[index]["Elongation @ Peak MAXIMUM\n(CD)"] && xlData[index]["Elongation @ Peak MAXIMUM\n(CD)"] != "NA") {
                obj.elongationpeakcdmax = Number(`${xlData[index]["Elongation @ Peak MAXIMUM\n(CD)"]}`.replace("›", "").trim());
            }
            obj.printingInkArr = [];
            if (
                xlData[index]["Printing Ink colour"] &&
                xlData[index]["Printing Ink colour"] != "NA" &&
                xlData[index]["Printing Ink colour"] != 0 &&
                xlData[index]["Printing Ink Pantone no."] &&
                xlData[index]["Printing Ink Pantone no."] != "NA" &&
                xlData[index]["Printing Ink Pantone no."] != 0
            ) {
                let inkObj: any = {};
                inkObj.printingink = `${xlData[index]["Printing Ink colour"]}`.trim();
                inkObj.printinginkpantone = `${xlData[index]["Printing Ink Pantone no."]}`.trim();
                obj.printingInkArr.push(inkObj);
            }

            if (
                xlData[index]["Printing Ink colour_1"] &&
                xlData[index]["Printing Ink colour_1"] != "NA" &&
                xlData[index]["Printing Ink colour_1"] != 0 &&
                xlData[index]["Printing Ink Pantone no._1"] &&
                xlData[index]["Printing Ink Pantone no._1"] != "NA" &&
                xlData[index]["Printing Ink Pantone no._1"] != 0
            ) {
                let inkObj: any = {};
                inkObj.printingink = `${xlData[index]["Printing Ink colour_1"]}`.trim();
                inkObj.printinginkpantone = `${xlData[index]["Printing Ink Pantone no._1"]}`.trim();
                obj.printingInkArr.push(inkObj);
            }
            if (
                xlData[index]["Printing Ink colour_2"] &&
                xlData[index]["Printing Ink colour_2"] != "NA" &&
                xlData[index]["Printing Ink colour_2"] != 0 &&
                xlData[index]["Printing Ink Pantone no._2"] &&
                xlData[index]["Printing Ink Pantone no._2"] != "NA" &&
                xlData[index]["Printing Ink Pantone no._2"] != 0
            ) {
                let inkObj: any = {};
                inkObj.printingink = `${xlData[index]["Printing Ink colour_2"]}`.trim();
                inkObj.printinginkpantone = `${xlData[index]["Printing Ink Pantone no._2"]}`.trim();
                obj.printingInkArr.push(inkObj);
            }
            if (
                xlData[index]["Printing Ink colour_3"] &&
                xlData[index]["Printing Ink colour_3"] != "NA" &&
                xlData[index]["Printing Ink colour_3"] != 0 &&
                xlData[index]["Printing Ink Pantone no._3"] &&
                xlData[index]["Printing Ink Pantone no._3"] != "NA" &&
                xlData[index]["Printing Ink Pantone no._3"] != 0
            ) {
                let inkObj: any = {};
                inkObj.printingink = `${xlData[index]["Printing Ink colour_3"]}`.trim();
                inkObj.printinginkpantone = `${xlData[index]["Printing Ink Pantone no._3"]}`.trim();
                obj.printingInkArr.push(inkObj);
            }
            if (
                xlData[index]["Printing Ink colour_4"] &&
                xlData[index]["Printing Ink colour_4"] != "NA" &&
                xlData[index]["Printing Ink colour_4"] != 0 &&
                xlData[index]["Printing Ink Pantone no._4"] &&
                xlData[index]["Printing Ink Pantone no._4"] != "NA" &&
                xlData[index]["Printing Ink Pantone no._4"] != 0
            ) {
                let inkObj: any = {};
                inkObj.printingink = `${xlData[index]["Printing Ink colour_4"]}`.trim();
                inkObj.printinginkpantone = `${xlData[index]["Printing Ink Pantone no._4"]}`.trim();
                obj.printingInkArr.push(inkObj);
            }
            if (
                xlData[index]["Printing Ink colour_5"] &&
                xlData[index]["Printing Ink colour_5"] != "NA" &&
                xlData[index]["Printing Ink colour_5"] != 0 &&
                xlData[index]["Printing Ink Pantone no._5"] &&
                xlData[index]["Printing Ink Pantone no._5"] != "NA" &&
                xlData[index]["Printing Ink Pantone no._5"] != 0
            ) {
                let inkObj: any = {};
                inkObj.printingink = `${xlData[index]["Printing Ink colour_5"]}`.trim();
                inkObj.printinginkpantone = `${xlData[index]["Printing Ink Pantone no._5"]}`.trim();
                obj.printingInkArr.push(inkObj);
            }
            if (xlData[index]["Repeat Length without tension MINIMUM"] && xlData[index]["Repeat Length without tension MINIMUM"] != "NA") {
                obj.repeatlengthwithouttensionmin = Number(`${xlData[index]["Repeat Length without tension MINIMUM"]}`.trim());
            }
            if (xlData[index]["Repeat Length without tension STANDARD"] && xlData[index]["Repeat Length without tension STANDARD"] != "NA") {
                obj.repeatlengthwithouttensionstd = Number(`${xlData[index]["Repeat Length without tension STANDARD"]}`.trim());
            }
            if (xlData[index]["Repeat Length without tension MAXIMUM"] && xlData[index]["Repeat Length without tension MAXIMUM"] != "NA") {
                obj.repeatlengthwithouttensionmax = Number(`${xlData[index]["Repeat Length without tension MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Sleeve Size"] && xlData[index]["Sleeve Size"] != "NA") {
                console.log(xlData[index]["Sleeve Size"], 'xlData[index]["Sleeve Size"]');
                obj.slevesize = Number(`${xlData[index]["Sleeve Size"]}`.trim());
            }
            if (xlData[index]["Printing design name"] && xlData[index]["Printing design name"] != "NA") {
                obj.printingdesignname = `${xlData[index]["Printing design name"]}`.trim();
            }
            if (xlData[index]["Printing Unwinding direction"] && xlData[index]["Printing Unwinding direction"] != "NA") {
                obj.printingunwindingdirection = `${xlData[index]["Printing Unwinding direction"]}`.trim();
            }
            if (xlData[index]["Non Woven Basis Weight MINIMUM"] && xlData[index]["Non Woven Basis Weight MINIMUM"] != "NA") {
                obj.nonwovenbasisweightmin = Number(`${xlData[index]["Non Woven Basis Weight MINIMUM"]}`.trim());
            }
            if (xlData[index]["Non Woven Basis Weight STANDARD"] && xlData[index]["Non Woven Basis Weight STANDARD"] != "NA") {
                obj.nonwovenbasisweightstd = Number(`${xlData[index]["Non Woven Basis Weight STANDARD"]}`.trim());
            }
            if (xlData[index]["Non Woven Basis Weight MAXIMUM"] && xlData[index]["Non Woven Basis Weight MAXIMUM"] != "NA") {
                obj.nonwovenbasisweightmax = Number(`${xlData[index]["Non Woven Basis Weight MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Thickness MINIMUM_1"] && xlData[index]["Thickness MINIMUM_1"] != "NA") {
                obj.thicknessmin = Number(`${xlData[index]["Thickness MINIMUM_1"]}`.trim());
            }
            if (xlData[index]["Thickness STANDARD_1"] && xlData[index]["Thickness STANDARD_1"] != "NA") {
                obj.thicknessstd = Number(`${xlData[index]["Thickness STANDARD_1"]}`.trim());
            }
            if (xlData[index]["Thickness MAXIMUM_1"] && xlData[index]["Thickness MAXIMUM_1"] != "NA") {
                obj.thicknessmax = Number(`${xlData[index]["Thickness MAXIMUM_1"]}`.trim());
            }
            if (xlData[index]["Width"] && xlData[index]["Width"] != "NA") {
                obj.laminationwidthmin = Number(`${xlData[index]["Width"]}`.trim());
            }
            if (xlData[index]["Width_1"] && xlData[index]["Width_1"] != "NA") {
                obj.laminationwidthstd = Number(`${xlData[index]["Width_1"]}`.trim());
            }
            if (xlData[index]["Width_2"] && xlData[index]["Width_2"] != "NA") {
                obj.laminationwidthmax = Number(`${xlData[index]["Width_2"]}`.trim());
            }
            if (xlData[index]["Length"] && xlData[index]["Length"] != "NA") {
                obj.length = Number(`${xlData[index]["Length"]}`.trim());
            }

            if (xlData[index]["Thickness MINIMUM_1"] && xlData[index]["Thickness MINIMUM_1"] != "NA") {
                obj.thicknessmin = Number(`${xlData[index]["Thickness MINIMUM_1"]}`.trim());
            }
            if (xlData[index]["Thickness STANDARD_1"] && xlData[index]["Thickness STANDARD_1"] != "NA") {
                obj.thicknessstd = Number(`${xlData[index]["Thickness STANDARD_1"]}`.trim());
            }
            if (xlData[index]["Thickness MAXIMUM_1"] && xlData[index]["Thickness MAXIMUM_1"] != "NA") {
                obj.thicknessmax = Number(`${xlData[index]["Thickness MAXIMUM_1"]}`.trim());
            }

            if (xlData[index]["LaminatedfilmBasis Weight MINIMUM"] && xlData[index]["LaminatedfilmBasis Weight MINIMUM"] != "NA") {
                obj.laminatedfilmbasisweightmin = Number(`${xlData[index]["LaminatedfilmBasis Weight MINIMUM"]}`.trim());
            }
            if (xlData[index]["LaminatedfilmBasis Weight STANDARD"] && xlData[index]["LaminatedfilmBasis Weight STANDARD"] != "NA") {
                obj.laminatedfilmbasisweightstd = Number(`${xlData[index]["LaminatedfilmBasis Weight STANDARD"]}`.trim());
            }
            if (xlData[index]["LaminatedfilmBasis Weight MAXIMUM"] && xlData[index]["LaminatedfilmBasis Weight MAXIMUM"] != "NA") {
                obj.laminatedfilmbasisweightmax = Number(`${xlData[index]["LaminatedfilmBasis Weight MAXIMUM"]}`.trim());
            }

            if (xlData[index]["Width_3"] && xlData[index]["Width_3"] != "NA") {
                obj.widthmin = Number(`${xlData[index]["Width_3"]}`.trim());
            }
            if (xlData[index]["Width_4"] && xlData[index]["Width_4"] != "NA") {
                obj.widthstd = Number(`${xlData[index]["Width_4"]}`.trim());
            }
            if (xlData[index]["Width_5"] && xlData[index]["Width_5"] != "NA") {
                obj.widthmax = Number(`${xlData[index]["Width_5"]}`.trim());
            }

            if (xlData[index]["Hydro Head Pressure MINIMUM"] && xlData[index]["Hydro Head Pressure MINIMUM"] != "NA") {
                obj.hydroheadpressuremin = Number(`${xlData[index]["Hydro Head Pressure MINIMUM"]}`.trim());
            }
            if (xlData[index]["Hydro Head Pressure STANDARD"] && xlData[index]["Hydro Head Pressure STANDARD"] != "NA") {
                obj.hydroheadpressurestd = Number(`${xlData[index]["Hydro Head Pressure STANDARD"]}`.trim());
            }
            if (xlData[index]["Hydro Head Pressure MAXIMUM"] && xlData[index]["Hydro Head Pressure MAXIMUM"] != "NA") {
                obj.hydroheadpressuremax = Number(`${xlData[index]["Hydro Head Pressure MAXIMUM"]}`.trim());
            }
            if (xlData[index]["WVTR MINIMUM_1"] && xlData[index]["WVTR MINIMUM_1"] != "NA") {
                obj.wvtrmin = Number(`${xlData[index]["WVTR MINIMUM_1"]}`.trim());
            }
            if (xlData[index]["WVTR STANDARD_1"] && xlData[index]["WVTR STANDARD_1"] != "NA") {
                obj.wvtrstd = Number(`${xlData[index]["WVTR STANDARD_1"]}`.trim());
            }
            if (xlData[index]["WVTR MAXIMUM_1"] && xlData[index]["WVTR MAXIMUM_1"] != "NA") {
                obj.wvtrmax = Number(`${xlData[index]["WVTR MAXIMUM_1"]}`.trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(MD) MINIMUM_1"] && xlData[index]["Tensile Strength @ Peak\n(MD) MINIMUM_1"] != "NA") {
                obj.tensilestrengthpeakmdmin = Number(`${xlData[index]["Tensile Strength @ Peak\n(MD) MINIMUM_1"]}`.trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(MD) STANDARD_1"] && xlData[index]["Tensile Strength @ Peak\n(MD) STANDARD_1"] != "NA") {
                obj.tensilestrengthpeakmdstd = Number(`${xlData[index]["Tensile Strength @ Peak\n(MD) STANDARD_1"]}`.trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(MD) STANDARD_2"] && xlData[index]["Tensile Strength @ Peak\n(MD) STANDARD_2"] != "NA") {
                obj.tensilestrengthpeakmdmax = Number(`${xlData[index]["Tensile Strength @ Peak\n(MD) STANDARD_2"]}`.trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(CD) MINIMUM_1"] && xlData[index]["Tensile Strength @ Peak\n(CD) MINIMUM_1"] != "NA") {
                obj.tensilestrengthpeakcdmin = Number(`${xlData[index]["Tensile Strength @ Peak\n(CD) MINIMUM_1"]}`.trim());
            }
            if (xlData[index]["Tensile Strength @ Peak \n(CD) STANDARD"] && xlData[index]["Tensile Strength @ Peak \n(CD) STANDARD"] != "NA") {
                obj.tensilestrengthpeakcdstd = Number(`${xlData[index]["Tensile Strength @ Peak \n(CD) STANDARD"]}`.trim());
            }
            if (xlData[index]["Tensile Strength @ Peak\n(CD) MAXIMUM_1"] && xlData[index]["Tensile Strength @ Peak\n(CD) MAXIMUM_1"] != "NA") {
                obj.tensilestrengthpeakcdmax = Number(`${xlData[index]["Tensile Strength @ Peak\n(CD) MAXIMUM_1"]}`.trim());
            }
            if (xlData[index]["Elongation @ Peak \n(MD) MINIMUM"] && xlData[index]["Elongation @ Peak \n(MD) MINIMUM"] != "NA") {
                obj.elongationpeakmdmin = Number(`${xlData[index]["Elongation @ Peak \n(MD) MINIMUM"]}`.trim());
            }
            if (xlData[index]["Elongation @ Peak\n(MD) STANDARD"] && xlData[index]["Elongation @ Peak\n(MD) STANDARD"] != "NA") {
                obj.elongationpeakmdstd = Number(`${xlData[index]["Elongation @ Peak\n(MD) STANDARD"]}`.trim());
            }
            if (xlData[index]["Elongation @ Peak\n(MD) MAXIMUM"] && xlData[index]["Elongation @ Peak\n(MD) MAXIMUM"] != "NA") {
                obj.elongationpeakmdmax = Number(`${xlData[index]["Elongation @ Peak\n(MD) MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Elongation @ Peak\n(CD) MINIMUM"] && xlData[index]["Elongation @ Peak\n(CD) MINIMUM"] != "NA") {
                obj.elongationpeakcdmin = Number(`${xlData[index]["Elongation @ Peak\n(CD) MINIMUM"]}`.trim());
            }
            if (xlData[index]["Elongation @ Peak\n(CD) STANDARD"] && xlData[index]["Elongation @ Peak\n(CD) STANDARD"] != "NA") {
                obj.elongationpeakcdstd = Number(`${xlData[index]["Elongation @ Peak\n(CD) STANDARD"]}`.trim());
            }
            if (xlData[index]["Elongation @ Peak\n(CD) MAXIMUM"] && xlData[index]["Elongation @ Peak\n(CD) MAXIMUM"] != "NA") {
                obj.elongationpeakcdmax = Number(`${xlData[index]["Elongation @ Peak\n(CD) MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Bonding \nTest (MD) MINIMUM"] && xlData[index]["Bonding \nTest (MD) MINIMUM"] != "NA") {
                obj.bondingtestmdmin = Number(`${xlData[index]["Bonding \nTest (MD) MINIMUM"]}`.trim());
            }
            if (xlData[index]["Bonding \nTest (MD) STANDARD"] && xlData[index]["Bonding \nTest (MD) STANDARD"] != "NA") {
                obj.bondingtestmdstd = Number(`${xlData[index]["Bonding \nTest (MD) STANDARD"]}`.trim());
            }
            if (xlData[index]["Bonding \nTest (MD) MAXIMUM"] && xlData[index]["Bonding \nTest (MD) MAXIMUM"] != "NA") {
                obj.bondingtestmdmax = Number(`${xlData[index]["Bonding \nTest (MD) MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Bonding \nTest (CD) MINIMUM"] && xlData[index]["Bonding \nTest (CD) MINIMUM"] != "NA") {
                obj.bondingtestcdmin = Number(`${xlData[index]["Bonding \nTest (CD) MINIMUM"]}`.trim());
            }
            if (xlData[index]["Bonding \nTest (CD) STANDARD"] && xlData[index]["Bonding \nTest (CD) STANDARD"] != "NA") {
                obj.bondingtestcdstd = Number(`${xlData[index]["Bonding \nTest (CD) STANDARD"]}`.trim());
            }
            if (xlData[index]["Bonding \nTest (CD) STANDARD_1"] && xlData[index]["Bonding \nTest (CD) STANDARD_1"] != "NA") {
                obj.bondingtestcdmax = Number(`${xlData[index]["Bonding \nTest (CD) STANDARD_1"]}`.trim());
            }
            if (xlData[index]["Slit width MINIMUM"] && xlData[index]["Slit width MINIMUM"] != "NA") {
                obj.slitWidthMin = Number(`${xlData[index]["Slit width MINIMUM"]}`.trim());
            }
            if (xlData[index]["Slit width STANDARD"] && xlData[index]["Slit width STANDARD"] != "NA") {
                obj.slitWidth = Number(`${xlData[index]["Slit width STANDARD"]}`.trim());
            }
            if (xlData[index]["Slit width MAXIMUM"] && xlData[index]["Slit width MAXIMUM"] != "NA") {
                obj.slitWidthMax = Number(`${xlData[index]["Slit width MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Std. Roll O.D. MINIMUM"] && xlData[index]["Std. Roll O.D. MINIMUM"] != "NA") {
                obj.stdrollodmin = Number(`${xlData[index]["Std. Roll O.D. MINIMUM"]}`.trim());
            }
            if (xlData[index]["Std. Roll O.D. STANDARD"] && xlData[index]["Std. Roll O.D. STANDARD"] != "NA") {
                obj.stdrollodstd = Number(`${xlData[index]["Std. Roll O.D. STANDARD"]}`.trim());
            }
            if (xlData[index]["Std. Roll O.D. MAXIMUM"] && xlData[index]["Std. Roll O.D. MAXIMUM"] != "NA") {
                obj.stdrollodmax = Number(`${xlData[index]["Std. Roll O.D. MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Std. Roll Length MINIMUM"] && xlData[index]["Std. Roll Length MINIMUM"] != "NA") {
                obj.stdrolllength = Number(`${xlData[index]["Std. Roll Length MINIMUM"]}`.trim());
            }

            if (xlData[index]["Core length MINIMUM"] && xlData[index]["Core length MINIMUM"] != "NA") {
                obj.corelengthmin = Number(`${xlData[index]["Core length MINIMUM"]}`.trim());
            }
            if (xlData[index]["Core length STANDARD"] && xlData[index]["Core length STANDARD"] != "NA") {
                obj.corelengthstd = Number(`${xlData[index]["Core length STANDARD"]}`.trim());
            }
            if (xlData[index]["Core length MAXIMUM"] && xlData[index]["Core length MAXIMUM"] != "NA") {
                obj.corelengthmax = Number(`${xlData[index]["Core length MAXIMUM"]}`.trim());
            }
            if (xlData[index]["Shelf Life"] && xlData[index]["Shelf Life"] != "NA") {
                obj.shelflife = `${xlData[index]["Shelf Life"]}`.trim();
            }
            if (xlData[index]["Final CT"] && xlData[index]["Final CT"] != "NA") {
                obj.finalct = `${xlData[index]["Final CT"]}`.trim();
            }
            if (xlData[index]["Final Unwinding direction"] && xlData[index]["Final Unwinding direction"] != "NA") {
                obj.finalunwindingdirection = `${xlData[index]["Final Unwinding direction"]}`.trim();
            }
            if (xlData[index]["Packing tape type"] && xlData[index]["Packing tape type"] != "NA") {
                obj.packingtapetype = `${xlData[index]["Packing tape type"]}`.trim();
            }
            if (xlData[index]["Connection type"] && xlData[index]["Connection type"] != "NA") {
                obj.connectiontype = `${xlData[index]["Connection type"]}`.trim();
            }
            if (xlData[index]["1 Joint / 2 Joint Connection %"] && xlData[index]["1 Joint / 2 Joint Connection %"] != "NA") {
                obj.halfjointconnection = Number(`${xlData[index]["1 Joint / 2 Joint Connection %"]}`.trim());
            }
            if (xlData[index]["No of connection rolls"] && xlData[index]["No of connection rolls"] != "NA" && xlData[index]["No of connection rolls"] != 0) {
                obj.noofconnectionrolls = Number(`${xlData[index]["No of connection rolls"]}`.trim());
            }

            // if (xlData[index]["Corona"]) {
            //     obj.corona = `${xlData[index]["Corona"]}`.trim();
            // }
            // if (xlData[index]["Thickness"]) {
            //     if (xlData[index]["Thickness"] && !isNaN(xlData[index]["Thickness"])) {
            //         obj.thickness = `${xlData[index]["Thickness"]}`.trim();
            //     }
            // }
            // if (xlData[index]["ThicknessMinValue"]) {
            //     if (xlData[index]["ThicknessMinValue"] && !isNaN(xlData[index]["ThicknessMinValue"])) {
            //         obj.thicknessMinValue = `${xlData[index]["ThicknessMinValue"]}`.trim();
            //     }
            // }

            // if (xlData[index]["ThicknessMaxValue"]) {
            //     if (xlData[index]["ThicknessMaxValue"] && !isNaN(xlData[index]["ThicknessMaxValue"])) {
            //         obj.thicknessMaxValue = `${xlData[index]["ThicknessMaxValue"]}`.trim();
            //     }
            // }
            // if (xlData[index]["FinalWidth"]) {
            //     if (xlData[index]["FinalWidth"] && !isNaN(xlData[index]["FinalWidth"])) {
            //         obj.finalWidth = `${xlData[index]["FinalWidth"]}`.trim();
            //     }
            // }
            // if (xlData[index]["WidthTolleranceMin"]) {
            //     if (xlData[index]["WidthTolleranceMin"] && !isNaN(xlData[index]["WidthTolleranceMin"])) {
            //         obj.widthTolleranceMin = `${xlData[index]["WidthTolleranceMin"]}`.trim();
            //     }
            // }
            // if (xlData[index]["WidthTolleranceMax"]) {
            //     if (xlData[index]["WidthTolleranceMax"] && !isNaN(xlData[index]["WidthTolleranceMax"])) {
            //         obj.widthTolleranceMax = `${xlData[index]["WidthTolleranceMax"]}`.trim();
            //     }
            // }
            // if (xlData[index]["LengthOfRoll"]) {
            //     if (xlData[index]["LengthOfRoll"] && !isNaN(xlData[index]["LengthOfRoll"])) {
            //         obj.lengthOfRoll = `${xlData[index]["LengthOfRoll"]}`.trim();
            //     }
            // }
            // if (xlData[index]["RollDiameter"]) {
            //     if (xlData[index]["RollDiameter"] && !isNaN(xlData[index]["RollDiameter"])) {
            //         obj.rollDiameter = `${xlData[index]["RollDiameter"]}`.trim();
            //     }
            // }
            // if (xlData[index]["min Diameter"]) {
            //     if (xlData[index]["min Diameter"] && !isNaN(xlData[index]["min Diameter"])) {
            //         obj.rollDiameterMin = `${xlData[index]["min Diameter"]}`.trim();
            //     }
            // }
            // if (xlData[index]["max Diameter"]) {
            //     if (xlData[index]["max Diameter"] && !isNaN(xlData[index]["max Diameter"])) {
            //         obj.rollDiameterMax = `${xlData[index]["max Diameter"]}`.trim();
            //     }
            // }
            // if (xlData[index]["CoreDia"]) {
            //     if (xlData[index]["CoreDia"] && !isNaN(xlData[index]["CoreDia"])) {
            //         obj.coreDia = `${xlData[index]["CoreDia"]}`.trim();
            //     }
            // }
            // if (xlData[index]["SlitWidth"]) {
            //     if (xlData[index]["SlitWidth"] && !isNaN(xlData[index]["SlitWidth"])) {
            //         obj.slitWidth = `${xlData[index]["SlitWidth"]}`.trim();
            //     }
            // }
            // if (xlData[index]["SlitWidthMin"]) {
            //     if (xlData[index]["SlitWidthMin"] && !isNaN(xlData[index]["SlitWidthMin"])) {
            //         obj.slitWidthMin = `${xlData[index]["SlitWidthMin"]}`.trim();
            //     }
            // }
            // if (xlData[index]["SlitWidthMax"]) {
            //     if (xlData[index]["SlitWidthMax"] && !isNaN(xlData[index]["SlitWidthMax"])) {
            //         obj.slitWidthMax = `${xlData[index]["SlitWidthMax"]}`.trim();
            //     }
            // }
            // if (xlData[index]["NoOfColors"]) {
            //     if (xlData[index]["NoOfColors"] && !isNaN(xlData[index]["NoOfColors"])) {
            //         obj.noOfColors = `${xlData[index]["NoOfColors"]}`.trim();
            //     }
            // }
            // if (xlData[index]["DesignName"]) {
            //     obj.designName = `${xlData[index]["DesignName"]}`.trim();
            // }
            // if (xlData[index]["PantoneColors"]) {
            //     obj.pantoneColors = `${xlData[index]["PantoneColors"]}`.trim();
            // }
            // if (xlData[index]["LaminationType"]) {
            //     obj.laminationType = `${xlData[index]["LaminationType"]}`.trim();
            // }
            // if (xlData[index]["FinalPrintingDirection"]) {
            //     obj.finalPrintingDirection = `${xlData[index]["FinalPrintingDirection"]}`.trim();
            // }
            // if (xlData[index]["FinalUnwindingDirection"]) {
            //     obj.finalUnwindingDirection = `${xlData[index]["FinalUnwindingDirection"]}`.trim();
            // }

            // if (xlData[index]["NonWowenBasisWeight"]) {
            //     if (xlData[index]["NonWowenBasisWeight"] && !isNaN(xlData[index]["NonWowenBasisWeight"])) {
            //         obj.nonWowenBasisWeight = `${xlData[index]["NonWowenBasisWeight"]}`.trim();
            //     }
            // }
            // if (xlData[index]["RepeatLength"]) {
            //     if (xlData[index]["RepeatLength"] && !isNaN(xlData[index]["RepeatLength"])) {
            //         obj.repeatLength = `${xlData[index]["RepeatLength"]}`.trim();
            //     }
            // }
            // if (xlData[index]["RepeatLengthMin"]) {
            //     if (xlData[index]["RepeatLengthMin"] && !isNaN(xlData[index]["RepeatLengthMin"])) {
            //         obj.repeatLengthMin = `${xlData[index]["RepeatLengthMin"]}`.trim();
            //     }
            // }
            // if (xlData[index]["RepeatLengthMax"]) {
            //     if (xlData[index]["RepeatLengthMax"] && !isNaN(xlData[index]["RepeatLengthMax"])) {
            //         obj.repeatLengthMax = `${xlData[index]["RepeatLengthMax"]}`.trim();
            //     }
            // }
            if (xlData[index]["Customer"]) {
                if (xlData[index]["Customer"] && xlData[index]["Customer"] != "") {
                    let customerObj = await Customer.findOne({ name: xlData[index]["Customer"] }).exec();
                    if (customerObj) {
                        obj.customerId = customerObj._id;
                    } else {
                        // console.error("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE")
                    }
                }
            }
            if (xlData[index]["ProductCategory"]) {
                if (xlData[index]["ProductCategory"] && xlData[index]["ProductCategory"] != "") {
                    let productCategoryObj = await ProductCategories.findOne({ name: xlData[index]["ProductCategory"] }).exec();
                    if (productCategoryObj) {
                        obj.productCategoryId = productCategoryObj._id;
                    } else {
                        console.error("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
                    }
                }
            }

            let productObj = await Product.findOne({ name: obj.name }).exec();
            if (productObj) {
                await Product.findByIdAndUpdate(productObj._id, obj).exec();
            } else {
                await new Product(obj).save();
            }
        }
        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const bulkUploadMachine = async (req: any, res: any, next: any) => {
    try {
        let workbook = XLSX.readFile(req.file.path);
        let sheet_nameList = workbook.SheetNames;
        let x = 0;
        let xlData: any = [];
        sheet_nameList.forEach((element) => {
            xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[sheet_nameList[x]]));
            x++;
        });
        let productsArr = await Product.find().exec();

        let machinesArr = await Machines.find().lean().exec();
        let errorsArr = [];
        let finalArr: any = [];
        for (let index = 0; index < xlData.length; index++) {
            let obj: any = {};
            if (xlData[index]["Product code"]) {
                obj.productCode = `${xlData[index]["Product code"]}`
                    .replace("\n", " ")
                    .trim()
                    .split(" ")
                    .filter((el, index) => el != "")
                    .join(" ");
                obj.name = `${xlData[index]["Product code"]}`
                    .replace("\n", " ")
                    .trim()
                    .split(" ")
                    .filter((el, index) => el != "")
                    .join(" ");
            }

            let productObj = productsArr.find((el) => el.name == obj.name);
            if (productObj) {
                // throw new Error(`Product Not Found ${obj.name}`)
                obj.productId = productObj._id;
            }

            if (xlData[index]["MachineName"] && xlData[index]["MachineName"] != "") {
                let machinesObj = machinesArr.find((el) => el.name == xlData[index]["MachineName"]);
                if (machinesObj) {
                    obj.machineId = machinesObj._id;
                }
            }

            if (xlData[index]["Position"]) {
                if (xlData[index]["Position"] && !isNaN(xlData[index]["Position"])) {
                    obj.position = `${xlData[index]["Position"]}`.trim();
                }
            }

            // if (xlData[index]["ProductCategory"]) {
            //     if (xlData[index]["ProductCategory"] && xlData[index]['ProductCategory'] != "") {
            //         let productCategoryObj = await ProductCategories.findOne({name:xlData[index]['ProductCategory']}).exec()
            //         if(productCategoryObj){
            //             obj.productCategoryId = productCategoryObj._id;
            //         }
            //         else{
            //             console.error("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE")
            //         }
            //     }
            // }

            let existscheckIndex = finalArr.findIndex((el: any) => el.productId == obj.productId);
            if (existscheckIndex != -1) {
                finalArr[existscheckIndex].stagesArr.push({ machineId: obj.machineId, position: obj.position });
            } else {
                finalArr.push({ productId: obj.productId, stagesArr: [{ machineId: obj.machineId, position: obj.position }] });
            }

            // let coustomerObj = await Product.findOne({ name: obj.name }).exec()
            // if (coustomerObj) {
            //     await Product.findByIdAndUpdate(coustomerObj._id, obj).exec();
            // } else {
            //     await new Product(obj).save();
            // }
        }

        for (let index = 0; index < finalArr.length; index++) {
            const element = finalArr[index];
            await Product.findByIdAndUpdate(element.productId, { $set: { stagesArr: element.stagesArr } });
        }

        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
