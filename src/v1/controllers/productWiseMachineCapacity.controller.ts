import mongoose from "mongoose";
import { ProductWiseMachineCapacity } from "@models/productWiseMachineCapacity.model";
import { paginateAggregate } from "@helpers/paginateAggregate";
import { addLogs } from "@helpers/addLog";
import XLSX from "xlsx";
import { Product } from "@models/product.model";
import { Machines } from "@models/machines.model";

export const addProductWiseMachineCapacity = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await ProductWiseMachineCapacity.findOne({
            machineId: new mongoose.Types.ObjectId(req.body.machineId),
            productId: new mongoose.Types.ObjectId(req.body.productId),
        }).exec();
        if (existsCheck) {
            throw new Error("Product Wise Machine Capacity already exists");
        }
        await new ProductWiseMachineCapacity(req.body).save();
        addLogs("Product Wise Machine Capacity added", req.body.machineId, req.body.productId);
        res.status(201).json({
            message: "Product Wise Machine Capacity Created",
        });
    } catch (error) {
        next(error);
    }
};
export const getAllProductWiseMachineCapacity = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [{ value: req.query.query }];
        }
        if (req.query.machineId && req.query.machineId != "") {
            matchObj.machineId = new mongoose.Types.ObjectId(req.query.machineId);
        }
        if (req.query.productId && req.query.productId != "") {
            matchObj.productId = new mongoose.Types.ObjectId(req.query.productId);
        }

        pipeline.push({
            $match: matchObj,
        });

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
                $lookup: {
                    from: "machines",
                    localField: "machineId",
                    foreignField: "_id",
                    as: "machineObj",
                },
            },
            {
                $unwind: {
                    path: "$machineObj",
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $unwind: {
                    path: "$productObj",
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $addFields: {
                    "productId.label": "$productObj.name",
                    "productId.value": "$productObj._id",
                    "machineId.label": "$machineObj.name",
                    "machineId.value": "$machineObj._id",
                },
            },
            {
                $project: {
                    value: 1,
                    _id: 1,
                    productId: 1,
                    machineId: 1,
                },
            }
        );
        let ProductWiseMachineCapacityArr = await paginateAggregate(ProductWiseMachineCapacity, pipeline, req.query);

        res.status(201).json({
            message: "found all Product Wise Machine Capacity Categories",
            data: ProductWiseMachineCapacityArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getAllProductWiseMachineCapacityForSelectInput = async (req: any, res: any, next: any) => {
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

        let ProductWiseMachineCapacityArr = await ProductWiseMachineCapacity.aggregate(pipeline);
        res.status(201).json({
            message: "found all Product Wise Machine Capacity Categories",
            data: ProductWiseMachineCapacityArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getProductWiseMachineCapacityById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck: any = await ProductWiseMachineCapacity.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Product Wise Machine Capacity does not exists");
        }

        let pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id),
                },
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
                $lookup: {
                    from: "machines",
                    localField: "machineId",
                    foreignField: "_id",
                    as: "machineObj",
                },
            },
            {
                $unwind: {
                    path: "$machineObj",
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $unwind: {
                    path: "$productObj",
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $addFields: {
                    "productId.label": "$productObj.name",
                    "productId.value": "$productObj._id",
                    "machineId.label": "$machineObj.name",
                    "machineId.value": "$machineObj._id",
                },
            },
            {
                $project: {
                    value: 1,
                    _id: 1,
                    productId: 1,
                    machineId: 1,
                },
            },
        ];

        let productCategoryIdObj = await ProductWiseMachineCapacity.aggregate(pipeline).exec();
        if (productCategoryIdObj.length > 0) {
            productCategoryIdObj = productCategoryIdObj[0];
        }
        res.status(201).json({
            message: "found all ProductWiseMachineCapacity",
            data: productCategoryIdObj,
        });
    } catch (error) {
        next(error);
    }
};
export const updateProductWiseMachineCapacityById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await ProductWiseMachineCapacity.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Product Wise Machine Capacity does not exists");
        }

        addLogs("Product Wise Machine Capacity updated", req.body.name, req.params.id);
        let ProductWiseMachineCapacityObj = await ProductWiseMachineCapacity.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({
            message: "Product Wise Machine Capacity Updated",
        });
    } catch (error) {
        next(error);
    }
};
export const deleteProductWiseMachineCapacityById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await ProductWiseMachineCapacity.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Product Wise Machine Capacity does not exists");
        }
        let ProductWiseMachineCapacityObj = await ProductWiseMachineCapacity.findByIdAndDelete(req.params.id).exec();
        addLogs("Product Wise Machine Capacity removed", req.body.name, req.params.id);
        res.status(201).json({
            message: "Product Wise Machine Capacity Deleted",
        });
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
        let productsArr = await Product.find().exec();
        let machinesArr = await Machines.find().exec();
        let productWiseMachineCapacityArr = await ProductWiseMachineCapacity.find().lean().exec();
        let addArr: any[] = [];
        let updatePromisesArr:any[] = []
        
        for (let index = 0; index < xlData.length; index++) {
            let obj: any = {};

            console.log(xlData[index], "xlData[index]")
            if (xlData[index]["Product code"]) {
                obj.name = `${xlData[index]["Product code"]}`
                    .replace("\n", " ")
                    .trim()
                    .split(" ")
                    .filter((el, index) => el != "")
                    .join(" ");

                let productObj = productsArr.find((el) => el.name.toLowerCase() == obj.name.toLowerCase());
                // console.log(productObj,"SSS")
                if (productObj) {
                    // throw new Error(`Product Not Found ${obj.name}`)
                    obj.productId = productObj._id;
                }
                else{
                    errorsArr.push(`${obj.name} not found`)
                }
            }
            if (xlData[index]["MachineName"] && xlData[index]["MachineName"] != "") {
                let machinesObj = machinesArr.find((el) => el.name.trim().toLowerCase() == xlData[index]["MachineName"].trim().toLowerCase());
                console.log(machinesObj,"MACHINE OBJ")
                if (machinesObj) {
                    obj.machineId = machinesObj._id;
                }
            }
            if (xlData[index]["capacity(Per Hour)"]) {
                obj.value = `${xlData[index]["capacity(Per Hour)"]}`.trim() === "0" ?0: Number(`${xlData[index]["capacity(Per Hour)"]}`.trim());
            }
            else{
                obj.value = `${xlData[index]["capacity(Per Hour)"]}`.trim() === "0" ?0: Number(`${xlData[index]["capacity(Per Hour)"]}`.trim());
            }
            if (xlData[index]["capacity(Per Hour)"]) {
                obj.value = `${xlData[index]["capacity(Per Hour)"]}`.trim() === "0" ?0: Number(`${xlData[index]["capacity(Per Hour)"]}`.trim());
            }
            else{
                obj.value = `${xlData[index]["capacity(Per Hour)"]}`.trim() === "0" ?0: Number(`${xlData[index]["capacity(Per Hour)"]}`.trim());
            }
            console.log(obj,"FINAL OBJ")
            let existsCheck = productWiseMachineCapacityArr.find((el) => String(el.productId) == String(obj.productId) && String(el.machineId) == String(obj.machineId));
            if (existsCheck && obj.name) {
                updatePromisesArr.push(
                    ProductWiseMachineCapacity.findOneAndUpdate(
                        {
                            productId: obj.productId,
                            machineId: obj.machineId,
                        },
                        {
                            $set: { value: Number(obj.value) },
                        }
                    ).exec()
                );
            // } else{
            } else if(obj.name && obj.productId && obj.machineId){
                addArr.push(obj)
            }
        }
        if (updatePromisesArr.length) {
            await Promise.all(updatePromisesArr);
            updatePromisesArr = [];
        }
        if (addArr.length) {
            await ProductWiseMachineCapacity.insertMany(addArr);    
            addArr = [];
        }


        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
