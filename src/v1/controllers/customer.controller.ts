import { Customer, ICustomer } from "@models/customer.model";
import { NextFunction, Request, Response } from "express";
import { addLogs } from "@helpers/addLog";
import { paginateAggregate } from "@helpers/paginateAggregate";
import XLSX from "xlsx";

interface ICustunerArr {
    name: string;
    email: string;
    phone: string;
    gstNumber: string;
    billingAddress: string;
    shippingAddressArr: [
        {
            address: string;

        }
    ],
    customerCode: string;
}

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let existsCheck = await Customer.findOne({
            $or: [
                { name: new RegExp(`^${req.body.name}$`, "i") },
                // { customerCode: new RegExp(`^${req.body.customerCode}$`, "i") },
            ],
        }).exec();

        if (existsCheck) {
            throw new Error("A customer already exists with the same name");
        }

        const newCustomer = await new Customer(req.body).save();

        addLogs("New Agent added", req?.body?.name, req?.body?.email);

        res.json({
            success: true,
            data: newCustomer,
            message: "Successfully added new customer.",
        });
    } catch (error) {
        next(error);
    }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        let updatedCustomer: any = await Customer.findByIdAndUpdate(id, req.body, { new: true }).lean().exec();

        res.json({
            success: true,
            data: updatedCustomer,
            message: "Successfully updated.",
        });
    } catch (error) {
        next(error);
    }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findById(id).exec();

        res.json({
            success: true,
            data: customer,
            message: "Single user data",
        });
    } catch (error) {
        next(error);
    }
};

export const getAllCustomers = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [
                { name: new RegExp(req.query.query, "i") },
                { email: new RegExp(req.query.query, "i") },
                { phone: new RegExp(req.query.query, "i") },
                // { customerCode: new RegExp(req.query.query, "i") },
            ];
        }

        pipeline.push({
            $match: matchObj,
        });

        let customerArr = await paginateAggregate(Customer, pipeline, req.query);
        let dataArr: ICustunerArr[] = customerArr.data as ICustunerArr[];
        // console.log(dataArr, "shippingAddressArrshippingAddressArrshippingAddressArr")
        // const dataForExcel = dataArr.map(e => ({
        //     name: e.name,
        //     email: e.email,
        //     phone: e.phone,
        //     gstNumber: e.gstNumber,
        //     billingAddress: e.billingAddress,
        //     shippingAddressArr: e.shippingAddressArr,
        //     customerCode: e.customerCode,
        // }));

        // const workbook = new ExcelJS.Workbook();
        // const worksheet = workbook.addWorksheet("Meeting Products", {
        //     pageSetup: { paperSize: 9, orientation: "landscape" },
        // });

        // worksheet.columns = [
        //     { header: "name", key: "name", width: 10 },
        //     { header: "email", key: "email", width: 10 },
        //     { header: "phone", key: "phone", width: 10 },
        //     { header: "gstNumber", key: "gstNumber", width: 10 },
        //     { header: "billingAddress", key: "billingAddress", width: 10 },
        //     { header: "shippingAddressArr", key: "shippingAddressArr", width: 10 },
        //     { header: "customerCode", key: "customerCode", width: 10 },

        // ]

        // dataForExcel.forEach((user) => {
        //     worksheet.addRow(user); // Add data in worksheet
        // });


        // let filename = `Coustomer_${moment().format("DD-MM-YYYY")}.xlsx`;
        // const filePath = path.join("public", "uploads");

        // // Ensure the directory exists
        // if (!fs.existsSync(filePath)) {
        //     fs.mkdirSync(filePath, { recursive: true });
        // }

        // const fullFilePath = path.join(filePath, filename);
        // await workbook.xlsx.writeFile(`${fullFilePath}`).then(() => {
        //     console.log({
        //         status: "success",
        //         message: "Coustomer file downloaded",
        //         filename: filename,
        //     });
        // });

        res.status(201).json({
            message: "Found all customers",
            data: customerArr,
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
        for (let index = 0; index < xlData.length; index++) {
            let obj: any = {};
            console.log(xlData[index], "xlData[index]");
            if (xlData[index]["NAME"]) {
                obj.name = `${xlData[index]["NAME"]}`.trim();
            }
            if (xlData[index]["Email"]) {
                obj.email = `${xlData[index]["Email"]}`.trim();
            }
            if (xlData[index]["Phone"]) {
                obj.phone = `${xlData[index]["Phone"]}`.trim();
            }
            if (xlData[index]["Billing GstNumber"]) {
                obj.gstNumber = `${xlData[index]["Billing GstNumber"]}`.trim();
            }
            if (xlData[index]["Shipping GstNumber"]) {
                obj.gstNumber = `${xlData[index]["Shipping GstNumber"]}`.trim();
            }
            if (xlData[index]["Customer Code"]) {
                obj.customerCode = `${xlData[index]["Customer Code"]}`.trim();
            }
            if (xlData[index]["Billing Address"]) {
                obj.billingAddress = `${xlData[index]["Billing Address"]}`.trim();
            }
            if (xlData[index]["Shipping GstNumber"]) {
                obj.ShippingGstNumber = `${xlData[index]["Shipping GstNumber"]}`.trim();
            }
            if (xlData[index]["ShippingAddress1"]) {
                obj.shippingAddressArr = [{ address: `${xlData[index]["ShippingAddress1"]}`.trim() }];
            }
            let coustomerObj = await Customer.findOne({
                name: obj.name,
                phone: obj.phone,
                email: obj.email
            }).exec()
            if (coustomerObj) {
                await Customer.findByIdAndUpdate(coustomerObj._id, obj).exec();
            } else {
                await new Customer(obj).save();

            }

            console.log(obj, "objobjobjobjobjobjobj")
        };
        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


export const getAllCustomerForSelectInput = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [
                { name: new RegExp(req.query.query, "i") },
                { email: new RegExp(req.query.query, "i") },
                { phone: new RegExp(req.query.query, "i") },
                // { customerCode: new RegExp(req.query.query, "i") },
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

        let customerArr = await Customer.aggregate(pipeline);
        res.status(201).json({
            message: "Found all customers",
            data: customerArr,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const deletedCustomer = await Customer.findByIdAndDelete(id).exec();

        addLogs("Customer removed", req?.user?.userObj?.name, req?.user?.userObj?.email);
        res.json({
            message: "Deleted customer",
            success: true,
            data: deletedCustomer?._id,
        });
    } catch (error) {
        next(error);
    }
};
