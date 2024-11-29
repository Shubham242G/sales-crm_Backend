import mongoose from "mongoose"

export const rawMaterialPurchaseIndentByIdPipeline = (id:string) => {
    return  [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
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
                path: "$rawMaterialsArr",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "rawmaterials",
                localField: "rawMaterialsArr.rawMaterialId",
                foreignField: "_id",
                as: "rawMaterialObj",
            },
        },
        {
            $unwind: {
                path: "$rawMaterialObj",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $addFields: {
                "rawMaterialsArr.name": "$rawMaterialObj.name",
                "rawMaterialsArr.uom": "$rawMaterialsArr.unit",
            },
        },
        {
            $group: {
                _id: "$_id",
                salesOrderId: {
                    $first: "$salesOrderId",
                },
                customerId: {
                    $first: "$customerId",
                },
                ppcString: {
                    $first: "$ppcString",
                },
                ppcSequence: {
                    $first: "$ppcSequence",
                },
                customerObj: {
                    $first: {
                        name: "$customerObj.name",
                        _id: "$customerObj._id",
                    },
                },
                finalDate: {
                    $first: "$finalDate",
                },
                status: {
                    $first: "$status",
                },
                rawMaterialsArr: {
                    $addToSet: "$rawMaterialsArr",
                },
            },
        },
    ]
}