import mongoose from "mongoose";

export const salesOrderByIdPipeline = (id: string) => {
    return [
        {
            $match: { _id: new mongoose.Types.ObjectId(id) },
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
                productsArr: {
                    $addToSet: "$productsArr",
                },
                customerId: {
                    $first: "$customerId",
                },
                type: {
                    $first: "$type",
                },
                file: {
                    $first: "$file",
                },
            },
        },
    ];
};

export const getSalesOrderForWorkOrder = (id: string, productId: string) => {
    return [
        {
            $match: { _id: new mongoose.Types.ObjectId(id) },
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
            $addFields: {
                productObj: {
                    productId: "$productsArr.productId",
                    quantity: "$productsArr.quantity",
                },
            },
        },
        {
            $project: {
                productsArr: 0,
            },
        },
        {
            $match: {
                "productObj.productId": new mongoose.Types.ObjectId(productId),
            },
        },
        {
            $lookup: {
                from: "boms",
                localField: "productObj.productId",
                foreignField: "productId",
                pipeline: [
                    {
                        $lookup: {
                            from: "bomstages",
                            localField: "_id",
                            foreignField: "bomId",
                            as: "bomStages",
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
            $lookup: {
                from: "purchaseorders",
                localField: "_id",
                foreignField: "salesOrderId",
                as: "poObj",
            },
        },
        {
            $lookup: {
                from: "qualitycontrolbasedatas",
                localField: "productObj.productId",
                foreignField: "productId",
                pipeline: [
                    {
                        $unwind: {
                            path: "$stagesArr",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $addFields: {
                            "stagesArr.stageOrder": {
                                $switch: {
                                    branches: [
                                        {
                                            case: {
                                                $eq: ["$stagesArr.stageName", "EXTRUSION"],
                                            },
                                            then: 1,
                                        },
                                        {
                                            case: {
                                                $eq: ["$stagesArr.stageName", "PRINTING"],
                                            },
                                            then: 2,
                                        },
                                        {
                                            case: {
                                                $eq: ["$stageName", "LAMINATION"],
                                            },
                                            then: 3,
                                        },
                                        {
                                            case: {
                                                $eq: ["$stagesArr.stageName", "COATING"],
                                            },
                                            then: 4,
                                        },
                                        {
                                            case: {
                                                $eq: ["$stagesArr.stageName", "SLITTING"],
                                            },
                                            then: 5,
                                        },
                                        {
                                            case: {
                                                $eq: ["$stagesArr.stageName", "REWINDING"],
                                            },
                                            then: 6,
                                        },
                                    ],
                                    default: 7,
                                },
                            },
                        },
                    },
                    {
                        $group: {
                            _id: "$_id",
                            productId: {
                                $first: "$productId",
                            },
                            createdAt: {
                                $first: "$createdAt",
                            },
                            updatedAt: {
                                $first: "$updatedAt",
                            },
                            stagesArr: {
                                $addToSet: "$stagesArr",
                            },
                        },
                    },
                ],
                as: "qcObj",
            },
        },
        {
            $unwind: {
                path: "$qcObj",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $addFields: {
                qcStagesArr: "$qcObj.stagesArr",
            },
        },
        {
            $project: {
                qcStagesArr: {
                    $sortArray: {
                        input: "$qcStagesArr",
                        sortBy: {
                            stageOrder: 1,
                        },
                    },
                },
                customerId: 1,
                deliveryDate: 1,
                type: 1,
                file: 1,
                soType: 1,
                approvalPending: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                customerObj: 1,
                productObj: 1,
                bomObj: 1,
                poObj: 1,
            },
        },
    ];
};
