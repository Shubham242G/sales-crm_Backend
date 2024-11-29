import mongoose from "mongoose";

export const rawMaterialPurchaseOrderByIdPipeline = (id: string) => {
    return [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
            },
        },
        {
            $lookup:
                /**
                 * from: The target collection.
                 * localField: The local join field.
                 * foreignField: The target join field.
                 * as: The name for the results.
                 * pipeline: Optional pipeline to run on the foreign collection.
                 * let: Optional variables to use in the pipeline field stages.
                 */
                {
                    from: "salesorders",
                    localField: "salesOrderId",
                    foreignField: "_id",
                    as: "salesOrderObj",
                },
        },
        {
            $unwind:
                /**
                 * path: Path to the array field.
                 * includeArrayIndex: Optional name for index.
                 * preserveNullAndEmptyArrays: Optional
                 *   toggle to unwind null and empty values.
                 */
                {
                    path: "$salesOrderObj",
                    preserveNullAndEmptyArrays: true,
                },
        },
        {
            $lookup:
                /**
                 * from: The target collection.
                 * localField: The local join field.
                 * foreignField: The target join field.
                 * as: The name for the results.
                 * pipeline: Optional pipeline to run on the foreign collection.
                 * let: Optional variables to use in the pipeline field stages.
                 */
                {
                    from: "rawmaterialpurchaseindents",
                    localField: "indentId",
                    foreignField: "_id",
                    as: "indentObj",
                },
        },
        {
            $unwind:
                /**
                 * path: Path to the array field.
                 * includeArrayIndex: Optional name for index.
                 * preserveNullAndEmptyArrays: Optional
                 *   toggle to unwind null and empty values.
                 */
                {
                    path: "$indentObj",
                    preserveNullAndEmptyArrays: true,
                },
        },
        {
            $unwind:
                /**
                 * path: Path to the array field.
                 * includeArrayIndex: Optional name for index.
                 * preserveNullAndEmptyArrays: Optional
                 *   toggle to unwind null and empty values.
                 */
                {
                    path: "$salesOrderObj",
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
                  $first: "$salesOrderId"
                },
                note: {
                  $first: "$note"
                },
                revNo: {
                  $first: "$revNo"
                },
                revDate: {
                  $first: "$revDate"
                },
                effectiveDate: {
                  $first: "$effectiveDate"
                },
                createdAt: {
                  $first: "$createdAt"
                },
                updatedAt: {
                  $first: "$updatedAt"
                },
                dispatchDestination: {
                  $first: "$dispatchDestination"
                },
                customerId: {
                  $first: "$customerId"
                },
                insurance: {
                  $first: "$insurance"
                },
                dispatchArrangement: {
                  $first: "$dispatchArrangement"
                },
                modeOfDispatch: {
                  $first: "$modeOfDispatch"
                },
                basicTotal: {
                  $first: "$basicTotal"
                },
                freight: {
                  $first: "$freight"
                },
                paymentTerms: {
                  $first: "$paymentTerms"
                },
                deliveryDate: {
                  $first: "$deliveryDate"
                },
                totalAmount: {
                  $first: "$totalAmount"
                },
                cgst: {
                  $first: "$cgst"
                },
                roundOff: {
                  $first: "$roundOff"
                },
                igst: {
                  $first: "$igst"
                },
                sgst: {
                  $first: "$sgst"
                },
                status: {
                  $first: "$status"
                },
                finalDate: {
                  $first: "$finalDate"
                },
                purchaseOrderNo: {
                  $first: "$purchaseOrderNo"
                },
                quotationNo: {
                  $first: "$quotationNo"
                },
                indentNo: {
                  $first: "$indentNo"
                },
                purchaseOrderDate: {
                  $first: "$purchaseOrderDate"
                },
                indentObj: {
                  $first: "$indentObj"
                },
                salesOrderObj: {
                  $first: "$salesOrderObj"
                },
                customerObj: {
                  $first: "$customerObj"
                },
                rawMaterialsArr: {
                  $addToSet: "$rawMaterialsArr"
                }
              },
        },
    ];
};
