import { Vendors } from "@models/vendors.model";
import { NextFunction, Request, Response } from "express";
import { addLogs } from "@helpers/addLog";
import { paginateAggregate } from "@helpers/paginateAggregate";
import XLSX from "xlsx";

export const createVendors = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let existsCheck = await Vendors.findOne({
            $or: [
                { name: new RegExp(`^${req.body.name}$`, "i") },
            ],
        }).exec();

        if (existsCheck) {
            throw new Error("A Vendors already exists with same name or code");
        }

        const newVendors = await new Vendors(req.body).save();

        addLogs("New Agent added", req?.body?.name, req?.body?.email);
                                                        
        res.json({
            success: true,
            data: newVendors,
            message: "Successfully added new Vendors.",
        });
    } catch (error) {
        console.error(error, "Error in Vendors controller....");
        next(error);
    }
};

export const updateVendors = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        let result: any = [];

        let updatedVendors: any = await Vendors.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        )
            .lean()
            .exec();

        if (updatedVendors) {
            result = { ...updatedVendors };
        }

        res.json({
            success: true,
            data: result,
            message: "Successfully updated.",
        });
    } catch (error) {
        next(error);
    }
};

export const getVendors = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const VendorsObj = await Vendors.findById(id).exec();

        res.json({
            success: true,
            data: VendorsObj,
            message: "single user data",
        });
    } catch (error) {
        console.error(error, "Error in Vendors controller....");
        next(error);
    }
};

export const getAllVendorss = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [
                { name: new RegExp(req.query.query, "i") },
                { email: new RegExp(req.query.query, "i") },
                { phone: new RegExp(req.query.query, "i") },
                { VendorsCode: new RegExp(req.query.query, "i") },
            ];
        }

        pipeline.push({
            $match: matchObj,
        });


        if (req.query.isForSelectInput) {
            pipeline.push({
                '$project': {
                    'label': "$name",
                    'value': "$_id",
                    cgst: 1,
                    sgst: 1,
                    igst: 1,
                    paymentTerms: 1,
                    freight: 1,
                    modeOfDispatch: 1,
                    dispatchArrangement: 1,
                    methodOfProductApproval: 1,
                    insurance: 1,
                    dispatchDestination: 1,
                    note: 1,
                    distribution: 1,
                    retentionPeriod: 1,
                }
            })
        }
        let VendorsArr = await paginateAggregate(
            Vendors,
            pipeline,
            req.query
        );

        res.status(201).json({
            message: "found all Product Categories",
            data: VendorsArr,
        });
    } catch (error) {
        next(error);
    }
};
export const getAllVendorsForSelectInput = async (
    req: any,
    res: any,
    next: any
) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [
                { name: new RegExp(req.query.query, "i") },
                { email: new RegExp(req.query.query, "i") },
                { phone: new RegExp(req.query.query, "i") },
                { VendorsCode: new RegExp(req.query.query, "i") },
            ];
        }

        pipeline.push(
            {
                $match: matchObj,
            },
            {
                $project: {
                    label: "$name",
                    value: "$_id",
                    cgst: 1,
                    sgst: 1,
                    igst: 1,
                    paymentTerms: 1,
                    freight: 1,
                    modeOfDispatch: 1,
                    dispatchArrangement: 1,
                    methodOfProductApproval: 1,
                    insurance: 1,
                    dispatchDestination: 1,
                    note: 1,
                    distribution: 1,
                    retentionPeriod: 1,
                    _id: 0,
                },
            }
        );

        let VendorsArr = await Vendors.aggregate(pipeline);
        res.status(201).json({
            message: "found all Product Categories",
            data: VendorsArr,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteVendors = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const dlteVendors = await Vendors.findByIdAndDelete(id).exec();

        addLogs(
            "Vendors removed",
            req?.user?.userObj?.name,
            req?.user?.userObj?.email
        );
        res.json({
            message: "deleted Vendors",
            success: true,
            data: dlteVendors?._id,
        });
    } catch (error) {
        console.error(error, "Error in Vendors controller....");
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

            // console.log(Object.keys(rowData));

            if (rowData["Vendor Name"]) obj.name = rowData["Vendor Name"].trim();
            if (rowData["SafeCo Code"]) obj.safeCoCode = rowData["SafeCo Code"].trim();
            if (rowData["Cgst"] == "-" || rowData["Cgst"] == undefined) {
                obj.cgst = null;
            } else {
                // console.log(typeof (rowData["Cgst"]), "datataaaa")
                obj.cgst = rowData["Cgst"] * 100;
            }
            if (rowData["Sgst"] == "-" || rowData["Sgst"] == undefined) {
                obj.sgst = null;
            } else {
                console.log(typeof (rowData["Cgst"]), "datataaaa")
                obj.sgst = rowData["Sgst"] * 100;
            }
            if (rowData["Igst"] == "-" || rowData["Igst"] == undefined) {
                obj.igst = null;
            } else {
                console.log(typeof (rowData["Igst"]), "datataaaa")
                obj.igst = rowData["Igst"] * 100;
            }
            console.log(rowData,"rowData")
            if (rowData["Payment Terms"]) obj.paymentTerms = rowData["Payment Terms"].trim();
            if (rowData["Freight"]) obj.freight = rowData["Freight"].trim();
            if (rowData["Mode Of Dispatch"]) obj.modeOfDispatch = rowData["Mode Of Dispatch"].trim();
            if (rowData["Dispatch\r\nArrangement"]) obj.dispatchArrangement = rowData["Dispatch\r\nArrangement"].trim();
            // if (rowData["Method Of Product Approval"]) obj.methodOfProductApproval = rowData["Method Of Product Approval"].trim();
            if (rowData["Insurance"]) obj.insurance = rowData["Insurance"].trim();
            if (rowData["Dispatch\r\nDestination"]) obj.dispatchDestination = rowData["Dispatch\r\nDestination"].trim();
            if (rowData["Note"]) obj.note = rowData["Note"].trim();


            if (rowData["Raw Material Category Name"]) obj.Raw_Material_Category_Name = rowData["Raw Material Category Name"].trim();
            console.log(obj)
            const existingProduct = await Vendors.findOne({ safeCoCode: obj.safeCoCode }).exec();
            if (existingProduct) {
                await Vendors.findOneAndUpdate({ safeCoCode: existingProduct.safeCoCode, obj }).exec();
            } else {
                await new Vendors(obj).save();
            }
        }

        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};