import { IStore, Store } from "@models/store.model";
import mongoose from "mongoose";
import { paginateAggregate } from "@helpers/paginateAggregate";
import { addLogs } from "@helpers/addLog";
import XLSX from "xlsx";
import { RawMaterials } from "@models/rawMaterials.model";


export const addStore = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    let existsCheck = await Store.findOne({
      name: new RegExp(`^${req.body.name}$`, "i"),
    }).exec();
    if (existsCheck) {
      throw new Error("Store already exists");
    }
    await new Store(req.body).save();
    addLogs("Store added", req.body.name, req.body.name);
    res.status(201).json({ message: "Store Created" });
  } catch (error) {
    next(error);
  }
};






export const getAllStore = async (req: any, res: any, next: any) => {
  try {
    let pipeline: any = [];
    let matchObj: any = {};
    if (req.query.query && req.query.query != "") {
      matchObj.$or = [
        { name: new RegExp(req.query.query, "i") },
      ];
    }

    pipeline.push({
      $match: matchObj,
    });

    let StoreArr = await paginateAggregate(Store, pipeline, req.query);

    res.status(201).json({
      message: "found all MOQ",
      data: StoreArr,
    });
  } catch (error) {
    next(error);
  }
};


export const getStoreById = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    const { id } = req.params;
    let pipeline = [
      {
        '$match': {
          '_id': new mongoose.Types.ObjectId(id)
        }
      }, {
        '$unwind': {
          'path': '$rawMaterialArr',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$lookup': {
          'from': 'rawmaterials',
          'localField': 'rawMaterialArr.rawMaterialId',
          'foreignField': '_id',
          'as': 'rawMaterialObj'
        }
      }, {
        '$unwind': {
          'path': '$rawMaterialObj',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$addFields': {
          'rawMaterialArr.label': '$rawMaterialObj.name',
          'rawMaterialArr.value': '$rawMaterialObj._id'
        }
      }, {
        '$group': {
          '_id': '$_id',
          'name': {
            '$first': '$name'
          },
          'retailerid': {
            '$first': '$retailerid'
          },
          'rawMaterialArr': {
            '$addToSet': '$rawMaterialArr'
          }
        }
      }
    ]
    let StoreObj: IStore[] | IStore = await Store.aggregate(pipeline);
    if (!StoreObj || (StoreObj.length == 0)) {
      throw new Error("Minimum order quantity not found !!!");
    }
    StoreObj = StoreObj[0]
    res.json({
      success: true,
      data: StoreObj,
      message: "Store data",
    });
  } catch (error) {
    next(error);
  }
};




export const updateStoreById = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    let existsCheck = await Store.findById(req.params.id)
      .lean()
      .exec();
    if (!existsCheck) {
      throw new Error("Store does not exists");
    }

    addLogs("Store updated", req.body.name, req.body.name);
    let grnObj =
      await Store.findByIdAndUpdate(
        req.params.id,
        req.body
      ).exec();
    res.status(201).json({ message: "Store Updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteStoreById = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    let existsCheck = await Store.findById(
      req.params.id
    ).exec();
    if (!existsCheck) {
      throw new Error("Store does not exists");
    }
    let StoreObj =
      await Store.findByIdAndDelete(req.params.id).exec();
    addLogs(" removed", req.body.name, req.body.name);
    res.status(201).json({ message: "Store Deleted" });
  } catch (error) {
    next(error);
  }
};




// [
//   {
//     '$unwind': {
//       'path': '$rawMaterialArr',
//       'preserveNullAndEmptyArrays': true
//     }
//   }, {
//     '$lookup': {
//       'from': 'rawmaterials',
//       'localField': 'rawMaterialArr.rawMaterialId',
//       'foreignField': '_id',
//       'as': 'result'
//     }
//   }, {
//     '$unwind': {
//       'path': '$result',
//       'preserveNullAndEmptyArrays': true
//     }
//   }
// ]


export const bulkUpload = async (req: any, res: any, next: any) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetNameList = workbook.SheetNames;
    let xlData: any = [];
    sheetNameList.forEach((sheetName) => {
      xlData.push(...XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
    });

    let finalArr: any[] = [];

    for (let index = 0; index < xlData.length; index++) {
      const rowData = xlData[index];

      if (rowData["Name"] && rowData["Raw Material"]) {
        const rawMaterial = await RawMaterials.findOne({ name: rowData["Raw Material"].trim() }).exec();

        if (rawMaterial) {
          let nameIndex = finalArr.findIndex((el) => el.name == rowData["Name"]);

          if (nameIndex === -1) {
            finalArr.push({ name: rowData["Name"].trim(), rawMaterialArr: [] });
            nameIndex = finalArr.length - 1;
          }

          finalArr[nameIndex].rawMaterialArr.push({
            rawMaterialId: rawMaterial._id
          });
        }
      }
    }

    for (let store of finalArr) {
      const existingStore = await Store.findOne({ name: store.name }).exec();
      if (existingStore) {
        await Store.findOneAndUpdate({ name: existingStore.name }, store).exec();
      } else {
        await new Store(store).save();
      }
    }

    res.status(200).json({ message: "Successfully Uploaded file", success: true });
  } catch (error) {
    console.error(error);
    next(error);
  }
};