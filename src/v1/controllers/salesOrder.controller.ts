import { DEPARTMENT, GENERALSTATUS, ROLES, STAGES } from "@common/constant.common";
import { REQUEST_TYPES } from "@common/request.common";
import { addApprovalRequest } from "@helpers/addApprovalRequest";
import { storeFileAndReturnNameBase64 } from "@helpers/fileSystem";
import { SalesOrder } from "@models/salesOrder.model";
import { Customer } from "@models/customer.model";
import { User } from "@models/user.model";
import mongoose, { PipelineStage } from "mongoose";
import { getSalesOrderForWorkOrder, salesOrderByIdPipeline } from "../../builders/salesOrder.builder";
import { Product } from "@models/product.model";

export const addSalesOrder = async (req: any, res: any, next: any) => {
    try {
        if (req.body.file && `${req.body.file}`.includes("base64") && `${req.body.file}` != "") {
            let fileUrl = await storeFileAndReturnNameBase64(req.body.file);
            req.body.file = fileUrl;
        }

        if (req.body.customerId) {
            let customerObj = await Customer.findById(req.body.customerId).exec();
            if (customerObj) {
                req.body.customerObj = customerObj;
            }
        }

        for (let i = 0; i < req.body.productsArr.length; i++) {
            const element = req.body.productsArr[i];
            let productObj = await Product.findById(element.productId).exec();
            if (productObj) {
                element.productObj = productObj;
            }
        }

        let salesOrderObj = await new SalesOrder(req.body).save();

        ///////////////////approval module starts here
        let usersArr = await User.find({
            role: {
                $in: [ROLES.MANAGEMENT, ROLES.MANAGER],
            },
            department: {
                $in: [DEPARTMENT.PPC],
            },
        }).exec();

        let previousDataPipeline = salesOrderByIdPipeline(String(salesOrderObj?._id));
        let previousDataObj = await SalesOrder.aggregate(previousDataPipeline);

        if (previousDataObj && previousDataObj.length > 0) {
            req.body = previousDataObj[0];
        }

        await addApprovalRequest(
            SalesOrder,
            salesOrderObj?._id,
            req.user.userObj,
            REQUEST_TYPES.SALES_ORDER.ADD,
            req.body,
            usersArr.map((el) => ({ name: el.name, approverId: el._id, approvalStatus: false })),
            undefined,
            undefined,
            `New Sales Order added by ${req?.user?.userObj?.name}`
        );
        ///////////////////approval module ends here

        res.status(201).json({ message: "Sales Order Created" });
    } catch (error) {
        next(error);
    }
};

export const getAllSalesOrder = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.name = new RegExp(req.query.query, "i");
        }

        if (req.query.status && req.query.status != "") {
            console.log(req.query.status.split(","), "req.query.status");
            matchObj.status = { $in: req.query.status.split(",") };
        }
        let pageValue = req.query.pageIndex ? parseInt(`${req.query.pageIndex}`) : 0;
        let limitValue = req.query.pageSize ? parseInt(`${req.query.pageSize}`) : 1000;

        pipeline.push(
            {
                $match: matchObj,
            },
            {
                $unwind: {
                    path: "$productsArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productsArr.productId",
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
                $lookup: {
                    from: "requestques",
                    localField: "_id",
                    foreignField: "requestPayload.origionalId",
                    pipeline: [
                        {
                            $match: {
                                "approvalArr.approvalStatus": false,
                            },
                        },
                        {
                            $project: {
                                approvalArr: 1,
                                _id: 0,
                            },
                        },
                        {
                            $limit: 1,
                        },
                    ],
                    as: "requesquesObj",
                },
            },
            {
                $unwind: {
                    path: "$requesquesObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    approvalArr: "$requesquesObj.approvalArr",
                },
            },
            {
                $addFields: {
                    productsArr: {
                        label: "$productObj.name",
                        value: "$productObj._id",
                    },
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
                    customerId: {
                        label: "$customerObj.name",
                        value: "$customerObj._id",
                    },
                },
            },
            {
                $group: {
                    _id: "$_id",
                    deliveryDate: {
                        $first: "$deliveryDate",
                    },
                    approvalArr: {
                        $first: "$approvalArr",
                    },
                    type: {
                        $first: "$type",
                    },
                    approvalPending: {
                        $first: "$approvalPending",
                    },
                    productsArr: {
                        $addToSet: "$productsArr",
                    },
                    customerId: {
                        $first: "$customerId",
                    },
                },
            },
            {
                $sort: { deliveryDate: 1 },
            },
            {
                $skip: pageValue * limitValue,
            },
            {
                $limit: limitValue,
            }
        );

        let SalesOrderArr = await SalesOrder.aggregate(pipeline);
        res.status(201).json({
            message: "found all Sales Order",
            data: SalesOrderArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getSalesOrderById = async (req: any, res: any, next: any) => {
    try {
        let pipeline = salesOrderByIdPipeline(req.params.id);

        let existsCheck = await SalesOrder.aggregate(pipeline);
        if (existsCheck && existsCheck.length == 0) {
            throw new Error("Sales Order does not exists");
        }
        res.status(201).json({
            message: "found all Sales Order",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};



export const updateSalesOrderById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await SalesOrder.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Sales Order does not exists");
        }

        if (req.body.file && `${req.body.file}`.includes("base64") && `${req.body.file}` != "") {
            let fileUrl = await storeFileAndReturnNameBase64(req.body.file);
            req.body.file = fileUrl;
        }

        if (req.body.customerId) {
            let customerObj = await Customer.findById(req.body.customerId).exec();
            if (customerObj) {
                req.body.customerObj = customerObj;
            }
        }

        for (let i = 0; i < req.body.productsArr.length; i++) {
            const element = req.body.productsArr[i];
            let productObj = await Product.findById(element.productId).exec();
            if (productObj) {
                element.productObj = productObj;
            }
        }


        let SalesOrderObj = await SalesOrder.findByIdAndUpdate(req.params.id, req.body).exec();
        ///////////////////approval module starts here
        let usersArr = await User.find({
            role: {
                $in: [ROLES.MANAGEMENT, ROLES.MANAGER],
            },
            department: {
                $in: [DEPARTMENT.PPC],
            },
        }).exec();

        if (req.body.status != GENERALSTATUS.WORKORDERPENDING) {
            let previousDataPipeline = salesOrderByIdPipeline(req.params.id);
            let previousDataObj = await SalesOrder.aggregate(previousDataPipeline);

            if (previousDataObj && previousDataObj.length > 0) {
                previousDataObj = previousDataObj[0];
            }
            if (SalesOrderObj) {
                let currentDataPipeline = salesOrderByIdPipeline(String(SalesOrderObj._id));
                let currentDataObj = await SalesOrder.aggregate(currentDataPipeline);
                if (currentDataObj && currentDataObj.length > 0) {
                    req.body = currentDataObj[0];
                }
            }

            await addApprovalRequest(
                SalesOrder,
                existsCheck?._id,
                req.user.userObj,
                REQUEST_TYPES.SALES_ORDER.UPDATE,
                req.body,
                usersArr.map((el) => ({ name: el.name, approverId: el._id, approvalStatus: false })),
                previousDataObj ? previousDataObj : undefined,
                undefined,
                `New Sales Order added by ${req?.user?.userObj?.name}`
            );
        }
        ///////////////////approval module ends here

        // addLogs(' updated', , );
        res.status(201).json({ message: "Sales Order Updated" });
    } catch (error) {
        next(error);
    }
};

export const deleteSalesOrderById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await SalesOrder.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Sales Order does not exists");
        }
        let SalesOrderObj = await SalesOrder.findByIdAndDelete(req.params.id).exec();
        // addLogs(' removed', , );
        res.status(201).json({ message: "Sales Order Deleted" });
    } catch (error) {
        next(error);
    }
};

export const getStoreOrderForStockChecking = async (req: any, res: any, next: any) => {
    try {
        let pipeline: PipelineStage[] = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id),
                },
            },
            {
                $unwind: {
                    path: "$productsArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "boms",
                    localField: "productsArr.productId",
                    foreignField: "productId",
                    pipeline: [
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
                                            pipeline: [
                                                {
                                                    $lookup: {
                                                        from: "rawmaterialcategories",
                                                        localField: "rawMaterialCategoryId",
                                                        foreignField: "_id",
                                                        as: "rawmaterialcategoryObj",
                                                    },
                                                },
                                                {
                                                    $lookup: {
                                                        from: "storestocks",
                                                        localField: "_id",
                                                        foreignField: "rawmaterialId",
                                                        as: "storeStocks",
                                                    },
                                                },
                                                {
                                                    $unwind: {
                                                        path: "$storeStocks",
                                                        preserveNullAndEmptyArrays: true,
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
                                                        categoryMaterialType: "$rawmaterialcategoryObj.materialType",
                                                        stock: {
                                                            $cond: {
                                                                if: {
                                                                    $ifNull: ["$storeStocks", false],
                                                                },
                                                                then: "$storeStocks.stock",
                                                                else: 0,
                                                            },
                                                        },
                                                    },
                                                },
                                                {
                                                    $project: {
                                                        storeStocks: 0,
                                                    },
                                                },
                                            ],
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
                                            "rawMaterialArr.label": "$rawmaterialObj.name",
                                            "rawMaterialArr.materialType": "$rawmaterialObj.materialType",
                                            "rawMaterialArr.stage": "$rawmaterialObj.stage",
                                            "rawMaterialArr.categoryMaterialType": "$rawmaterialObj.categoryMaterialType",
                                            "rawMaterialArr.amount": {
                                                $toString: "$rawMaterialArr.count",
                                            },
                                            "rawMaterialArr.value": "$rawmaterialObj._id",
                                            "rawMaterialArr.stock": "$rawmaterialObj.stock",
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
                                    // {
                                    //     $project: {
                                    //         stageOrder: 0,
                                    //     },
                                    // },
                                ],
                                as: "stageArr",
                            },
                        },
                    ],
                    as: "bomObj",
                },
            },
            {
                $unwind: {
                    path: "$bomObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "productsArr.bomObj": "$bomObj",
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
                $group: {
                    _id: "$_id",
                    customerId: {
                        $first: "$customerId",
                    },
                    deliveryDate: {
                        $first: "$deliveryDate",
                    },
                    customerObj: {
                        $first: {
                            name: "$customerObj.name",
                        },
                    },
                    productsArr: {
                        $addToSet: "$productsArr",
                    },
                },
            },
        ];

        let existsCheck = await SalesOrder.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("Sales Order does not exists");
        }

        res.status(201).json({
            message: "Sales Order for stock checking",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};

export const getPendingSalesOrderForWorkOrder = async (req: any, res: any, next: any) => {
    try {
        let pipeline = [
            {
                $match: {
                    // status: {
                    //     $eq: GENERALSTATUS.WORKORDERPENDING,
                    // },
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
                $unwind: {
                    path: "$productsArr",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "workorders",
                    localField: "productsArr.productId",
                    foreignField: "productId",
                    let: {
                        id: "$_id",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$salesOrderId", "$$id"],
                                },
                            },
                        },
                    ],
                    as: "workOrderArr",
                },
            },
            {
                $match: {
                    workOrderArr: {
                        $size: 0,
                    },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productsArr.productId",
                    foreignField: "_id",
                    as: "productsObj",
                },
            },
            {
                $unwind: {
                    path: "$productsObj",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    productObj: {
                        productId: "$productsArr.productId",
                        quantity: "$productsArr.quantity",
                        name: "$productsObj.name",
                    },
                },
            },
            {
                $project: {
                    productsObj: 0,
                    productsArr: 0,
                },
            },
        ];

        let existsCheck = await SalesOrder.aggregate(pipeline);
        if (!existsCheck || existsCheck.length == 0) {
            throw new Error("No pending sales order found");
        }

        res.status(201).json({
            message: "Sales Orders found",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};

export const getSalesOrderForWorkOrderById = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any[] = getSalesOrderForWorkOrder(req.params.id, req.params.productId);
        console.log(JSON.stringify(pipeline, null, 2), "pipeline");
        let existsCheck = await SalesOrder.aggregate(pipeline);
        if (existsCheck && existsCheck.length == 0) {
            throw new Error("Sales Order does not exists");
        }
        res.status(201).json({
            message: "found all Sales Order",
            data: existsCheck[0],
        });
    } catch (error) {
        next(error);
    }
};
