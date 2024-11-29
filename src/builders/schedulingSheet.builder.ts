export const getSchedulingSheetDataBetweenDates = (matchObj: any) => {
    return [
        {
            $match: matchObj,
        },
        {
            $unwind: {
                path: "$productIdArr",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "products",
                localField: "productIdArr.productId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            _id: 0,
                        },
                    },
                ],
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
                preserveNullAndEmptyArrays: true,
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
                "productIdArr.name": "$productObj.name",
                machineName: "$machineObj.name",
            },
        },
        {
            $project: {
                productObj: 0,
                machineObj: 0,
            },
        },
        {
            $group: {
                _id: "$_id",
                scheduledDate: {
                    $first: "$scheduledDate",
                },
                machineId: {
                    $first: "$machineId",
                },
                hoursUsed: {
                    $first: "$hoursUsed",
                },
                workOrderId: {
                    $first: "$workOrderId",
                },
                machinePosition: {
                    $first: "$machinePosition",
                },
                machineName: {
                    $first: "$machineName",
                },
                machineMaxQuantity: {
                    $first: "$machineMaxQuantity",
                },
                productIdArr: {
                    $addToSet: "$productIdArr",
                },
            },
        },
    ];
};
