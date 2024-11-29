import { paginateAggregate } from "@helpers/paginateAggregate";
import { Machines } from "@models/machines.model";
import { addLogs } from "@helpers/addLog";
import XLSX from "xlsx";

export const addMachine = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Machines.findOne({
            name: new RegExp(`^${req.body.name}$`, "i"),
        }).exec();
        if (existsCheck) {
            throw new Error("Machine already exists");
        }
        await new Machines(req.body).save();
        addLogs("Machine added", req.body.name, req.body.name);
        res.status(201).json({ message: "Machine Created" });
    } catch (error) {
        next(error);
    }
};
export const getAllMachine = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [{ name: new RegExp(req.query.query, "i") }, { machineCode: new RegExp(req.query.query, "i") }];
        }

        pipeline.push({
            $match: matchObj,
        });

        let MachineArr = await paginateAggregate(Machines, pipeline, req.query);

        res.status(201).json({
            message: "found all Machine",
            data: MachineArr,
        });
    } catch (error) {
        next(error);
    }
};

export const getMachineById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Machines.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Machine does not exists");
        }
        res.status(201).json({
            message: "found all Machine",
            data: existsCheck,
        });
    } catch (error) {
        next(error);
    }
};
export const updateMachineById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Machines.findById(req.params.id).lean().exec();
        if (!existsCheck) {
            throw new Error("Machine does not exists");
        }

        addLogs("Machine updated", req.body.name, req.body.name);
        let MachineObj = await Machines.findByIdAndUpdate(req.params.id, req.body).exec();
        res.status(201).json({ message: "Machine Updated" });
    } catch (error) {
        next(error);
    }
};
export const deleteMachineById = async (req: any, res: any, next: any) => {
    try {
        let existsCheck = await Machines.findById(req.params.id).exec();
        if (!existsCheck) {
            throw new Error("Machine does not exists");
        }
        let MachineObj = await Machines.findByIdAndDelete(req.params.id).exec();
        addLogs("Machine removed", req.body.name, req.body.name);
        res.status(201).json({ message: "Machine Deleted" });
    } catch (error) {
        next(error);
    }
};

export const getAllMachineForSelectInput = async (req: any, res: any, next: any) => {
    try {
        let pipeline: any = [];
        let matchObj: any = {};
        if (req.query.query && req.query.query != "") {
            matchObj.$or = [{ name: new RegExp(req.query.query, "i") }, { machineCode: new RegExp(req.query.query, "i") }];
        }

        pipeline.push(
            {
                $match: matchObj,
            },
            {
                $project: {
                    label: { $concat: ["$name", " ", "(", "$machineCode", ")"] },
                    value: "$_id",
                    _id: 0,
                },
            }
        );

        let MachineArr = await Machines.aggregate(pipeline);

        res.status(201).json({
            message: "found all Machine",
            data: MachineArr,
        });
    } catch (error) {
        next(error);
    }
};

// export const bulkUpload = async (req: any, res: any, next: any) => {
//     try {
//         const filePath = req.file.path;
//         const workbook = XLSX.readFile(filePath);
//         const sheetNameList = workbook.SheetNames;
//         let xlData: any = [];

//         sheetNameList.forEach((sheetName) => {
//             xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
//         });

//         for (let index = 0; index < xlData.length; index++) {
//             let obj: any = {};
//             const rowData = xlData[index];

//             if (rowData["MachineCode"]) obj.machineCode = rowData["MachineCode"].trim();
//             if (rowData["Name"]) obj.name = rowData["Name"].trim();

//             if (rowData["Category"]) obj.category = rowData["Category"].trim();
//             if (rowData["Capacity"]) obj.capacity = rowData["Capacity"];
//             // if (rowData["Method Of Product Approval"]) obj.methodOfProductApproval = rowData["Method Of Product Approval"].trim();
//             if (rowData["Unit"]) obj.unit = rowData["Unit"].trim();
//             if (rowData["Factory"]) obj.factory = rowData["Factory"].trim();
//             if (rowData["ChangeOverTime Name 1"]) {

//                 obj.changeOverTimeArr = [];

//                 // Collect changeOverTime details
//                 for (let i = 1; i <= 7; i++) {
//                     const nameField = `ChangeOverTime Name ${i}`;
//                     const timeField = `ChangeOverTime time ${i}`;

//                     if (rowData[nameField] && rowData[timeField]) {
//                         obj.changeOverTimeArr.push({
//                             name: rowData[nameField].trim(),
//                         });
//                     }
//                 }
//             }
//             if (rowData["ChangeOverTime time 1"]) {

//                 obj.changeOverTimeArr = [];

//                 // Collect changeOverTime details
//                 for (let i = 1; i <= 7; i++) {
//                     const nameField = `ChangeOverTime time 1 ${i}`;
//                     const timeField = `ChangeOverTime time 1 ${i}`;

//                     if (rowData[nameField] && rowData[timeField]) {
//                         obj.changeOverTimeArr.push({
//                             name: rowData[nameField].trim(),
//                         });
//                     }
//                 }
//             }
//             if (rowData["ChangeOverTime Name 2"]) {
//                 // Initialize the changeOverTimeArr array
//                 obj.changeOverTimeArr = [];

//                 // Collect changeOverTime details
//                 for (let i = 1; i <= 7; i++) {
//                     const nameField = `ChangeOverTime Name ${i}`;
//                     const timeField = `ChangeOverTime time ${i}`;

//                     if (rowData[nameField] && rowData[timeField]) {
//                         obj.changeOverTimeArr.push({
//                             name: rowData[nameField].trim(),
//                         });
//                     }
//                 }
//             }
//             if (rowData["ChangeOverTime time 2"]) {
//                 obj.changeOverTimeArr = [];

//                 // Collect changeOverTime details
//                 for (let i = 1; i <= 7; i++) {
//                     const nameField = `ChangeOverTime Name ${i}`;
//                     const timeField = `ChangeOverTime time ${i}`;

//                     if (rowData[nameField] && rowData[timeField]) {
//                         obj.changeOverTimeArr.push({
//                             name: rowData[nameField].trim(),
//                         });
//                     }
//                 }

//             }
//             if (rowData["ChangeOverTime Name 3"]) {
//                 obj.changeOverTimeArr = [];

//                 // Collect changeOverTime details
//                 for (let i = 1; i <= 7; i++) {
//                     const nameField = `ChangeOverTime Name ${i}`;
//                     const timeField = `ChangeOverTime time ${i}`;

//                     if (rowData[nameField] && rowData[timeField]) {
//                         obj.changeOverTimeArr.push({
//                             name: rowData[nameField].trim(),
//                         });
//                     }
//                 }

//             }
//             if (rowData["ChangeOverTime time 3"]) {
//                 obj.changeOverTimeArr = [];

//                 // Collect changeOverTime details
//                 for (let i = 1; i <= 7; i++) {
//                     const nameField = `ChangeOverTime Name ${i}`;
//                     const timeField = `ChangeOverTime time ${i}`;

//                     if (rowData[nameField] && rowData[timeField]) {
//                         obj.changeOverTimeArr.push({
//                             name: rowData[nameField].trim(),
//                         });
//                     }
//                 }

//             }
//             if (rowData["ChangeOverTime time 3"]) {
//                 obj.changeOverTimeArr = [];

//                 // Collect changeOverTime details
//                 for (let i = 1; i <= 7; i++) {
//                     const nameField = `ChangeOverTime Name ${i}`;
//                     const timeField = `ChangeOverTime time ${i}`;

//                     if (rowData[nameField] && rowData[timeField]) {
//                         obj.changeOverTimeArr.push({
//                             name: rowData[nameField].trim(),
//                         });
//                     }
//                 }
//             }

//             // if (rowData["Raw Material Category Name"]) obj.Raw_Material_Category_Name = rowData["Raw Material Category Name"].trim();

//             const existingProduct = await Machines.findOne({ safeCoCode: obj.safeCoCode }).exec();
//             // if (existingProduct) {
//             // Update logic if needed{}
//             // await Machines.findOneAndUpdate({ safeCoCode: existingProduct.safeCoCode, obj }).exec();
//             // } else {
//             await new Machines(obj).save();
//             // }
//         }

//         res.status(200).json({ message: "Successfully Uploaded file", success: true });
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// };

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

            obj.machineCode = rowData["MachineCode"] ? rowData["MachineCode"].trim() : null;
            obj.stage = rowData["Name"] ? rowData["Name"].trim() : null;
            obj.name = `${rowData["Category"]}-${rowData["MachineCode"].trim().split("-")[1]}`;
            obj.category = rowData["Category"] ? rowData["Category"].trim() : null;
            obj.capacity = rowData["Capacity"] ? rowData["Capacity"] : null;
            obj.unit = rowData["Unit"] ? rowData["Unit"].trim() : null;
            obj.factory = rowData["Factory"] ? rowData["Factory"].trim() : null;

            // console.log(obj.name, "name", `${rowData["Category"]}-${rowData["MachineCode"].trim().split("-")[1]}`);
            obj.changeOverTimeArr = [];

            if (rowData["ChangeOverTime Name 1"] && rowData["ChangeOverTime Name 1"] != "" && rowData["ChangeOverTime Name 1"] != "-") {
                let sampleName = rowData["ChangeOverTime Name 1"].trim().split(":")[0].trim();
                let sampleValue = Number(rowData["ChangeOverTime Name 1"].trim().replace("\n", "").split(":")[1].split("Minutes")[0]);
                obj.changeOverTimeArr.push({
                    name: sampleName,
                    amount: sampleValue,
                });
            }
            if (rowData["ChangeOverTime Name 2"] && rowData["ChangeOverTime Name 2"] != "" && rowData["ChangeOverTime Name 2"] != "-") {
                let sampleName = rowData["ChangeOverTime Name 2"].trim().split(":")[0].trim();
                let sampleValue = Number(rowData["ChangeOverTime Name 2"].trim().replace("\n", "").split(":")[1].split("Minutes")[0]);
                obj.changeOverTimeArr.push({
                    name: sampleName,
                    amount: sampleValue,
                });
            }
            if (rowData["ChangeOverTime Name 3"] && rowData["ChangeOverTime Name 3"] != "" && rowData["ChangeOverTime Name 3"] != "-") {
                let sampleName = rowData["ChangeOverTime Name 3"].trim().split(":")[0].trim();
                let sampleValue = Number(rowData["ChangeOverTime Name 3"].trim().replace("\n", "").split(":")[1].split("Minutes")[0]);
                obj.changeOverTimeArr.push({
                    name: sampleName,
                    amount: sampleValue,
                });
            }
            if (rowData["ChangeOverTime Name 4"] && rowData["ChangeOverTime Name 4"] != "" && rowData["ChangeOverTime Name 4"] != "-") {
                let sampleName = rowData["ChangeOverTime Name 4"].trim().split(":")[0].trim();
                let sampleValue = Number(rowData["ChangeOverTime Name 4"].trim().replace("\n", "").split(":")[1].split("Minutes")[0]);
                obj.changeOverTimeArr.push({
                    name: sampleName,
                    amount: sampleValue,
                });
            }
            if (rowData["ChangeOverTime Name 5"] && rowData["ChangeOverTime Name 5"] != "" && rowData["ChangeOverTime Name 5"] != "-") {
                let sampleName = rowData["ChangeOverTime Name 5"].trim().split(":")[0].trim();
                let sampleValue = Number(rowData["ChangeOverTime Name 5"].trim().replace("\n", "").split(":")[1].split("Minutes")[0]);
                obj.changeOverTimeArr.push({
                    name: sampleName,
                    amount: sampleValue,
                });
            }
            if (rowData["ChangeOverTime Name 6"] && rowData["ChangeOverTime Name 6"] != "" && rowData["ChangeOverTime Name 6"] != "-") {
                let sampleName = rowData["ChangeOverTime Name 6"].trim().split(":")[0].trim();
                let sampleValue = Number(rowData["ChangeOverTime Name 6"].trim().replace("\n", "").split(":")[1].split("Minutes")[0]);
                obj.changeOverTimeArr.push({
                    name: sampleName,
                    amount: sampleValue,
                });
            }
            if (rowData["ChangeOverTime Name 7"] && rowData["ChangeOverTime Name 7"] != "" && rowData["ChangeOverTime Name 7"] != "-") {
                let sampleName = rowData["ChangeOverTime Name 7"].trim().split(":")[0].trim();
                let sampleValue = Number(rowData["ChangeOverTime Name 7"].trim().replace("\n", "").split(":")[1].split("Minutes")[0]);
                obj.changeOverTimeArr.push({
                    name: sampleName,
                    amount: sampleValue,
                });
            }

            // console.log(rowData, "rowData");

            // console.log(obj);
            // Save the object to the database

            let existCheck = await Machines.findOne({ machineCode: obj.machineCode }).exec();
            // console.log(existCheck,"existCheck")
            if (!existCheck) {
                await new Machines(obj).save();
            }
        }

        console.log("Data successfully uploaded");
        res.status(200).json({ message: "Successfully Uploaded file", success: true });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
