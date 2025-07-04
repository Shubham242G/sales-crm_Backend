import { comparePassword, encryptPassword } from "@helpers/bcrypt";
import { generateAccessJwt, generateRefreshJwt } from "@helpers/jwt";
import { User } from "@models/user.model";
import { Request, Response, NextFunction } from "express";
import { addLogs } from "@helpers/addLog";
import mongoose, { PipelineStage } from "mongoose";
import { DEPARTMENT, ROLES } from "@common/constant.common";
import { paginateAggregate } from "@helpers/paginateAggregate";
import { ExportService } from "../../util/excelfile";
import ExcelJs from "exceljs";
import path from "path";
import fs from "fs";

export const webLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const UserExistCheck = await User.findOne({
      email: new RegExp(`^${req.body.email}$`),
    }).exec();

    if (!UserExistCheck) {
      throw new Error(`User Does Not Exist`);
    }

    const passwordCheck = await comparePassword(
      UserExistCheck.password,
      req.body.password
    );
    if (!passwordCheck) {
      throw new Error(`Invalid Credentials`);
    }

    const token = await generateAccessJwt({
      userId: UserExistCheck._id,
      role: UserExistCheck.role,
      department: UserExistCheck.department,
      user: {
        name: UserExistCheck.name,
        email: UserExistCheck.email,
        phone: UserExistCheck.phone,
        _id: UserExistCheck._id,
        accessObj: UserExistCheck.accessObj,
      },
    });
    let refreshToken = await generateRefreshJwt({
      userId: UserExistCheck._id,
      role: ROLES.USER,
      name: UserExistCheck.name,
      department: UserExistCheck.department,
      phone: UserExistCheck.phone,
      email: UserExistCheck.email,
    });
    addLogs("Login", UserExistCheck.name, UserExistCheck.email);
    res.status(200).json({
      message: "User Logged In",
      token,
      refreshToken,
      user: {
        name: UserExistCheck.name,
        email: UserExistCheck.email,
        phone: UserExistCheck.phone,
        role: UserExistCheck.role,
        department: UserExistCheck.department,
        _id: UserExistCheck._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body?.email) {
      throw { status: 401, message: "Email is require" };
    }
    const userObj = await User.findOne({
      email: new RegExp(`^${req.body.email}$`),
    })
      .lean()
      .exec();
    if (!userObj) {
      throw { status: 401, message: "user Not Found" };
    }

    // if (!verifyRefreshTokenJwt(req.body.email, req.body.refresh)) {
    //   throw { status: 401, message: "Refresh Token is not matched" };
    // }

    let accessToken = await generateAccessJwt({
      userId: userObj._id,
      role: ROLES.USER,
      name: userObj.name,
      department: userObj.department,
      phone: userObj.phone,
      email: userObj.email,
    });
    let refreshToken = await generateRefreshJwt({
      userId: userObj._id,
      role: ROLES.USER,
      name: userObj.name,
      department: userObj.department,
      phone: userObj.phone,
      email: userObj.email,
    });
    res.status(200).json({
      message: "Refresh Token",
      token: accessToken,
      refreshToken,
      user: {
        name: userObj.name,
        email: userObj.email,
        phone: userObj.phone,
        role: userObj.role,
        department: userObj.department,
        _id: userObj._id,
      },
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

export const addUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const UserExistNameCheck = await User.findOne({
    //   name: new RegExp(`^${req.body.name}$`, "i"),
    // }).exec();

    // if (UserExistNameCheck) {
    //   throw new Error(`User with this name Already Exists`);
    // }

    const UserExistEmailCheck = await User.findOne({
      email: new RegExp(`^${req.body.email}$`, "i"),
    }).exec();

    if (UserExistEmailCheck) {
      throw new Error(`User with this email Already Exists`);
    }

    const UserExistPhoneCheck = await User.findOne({
      phone: new RegExp(`^${req.body.phone}$`, "i"),
    }).exec();


    if (UserExistPhoneCheck) {
      throw new Error(`User with this Phone Number Already Exists`);
    }
    // const UserExistPhoneCheck = await User.findOne({
    //   phone: req.body.phone,
    // }).exec();
    // if (UserExistPhoneCheck) {
    //   throw new Error(`User with this phone Already Exists`);
    // }

    if (req.body.userName && req.body.userName != "") {
      const UserExistUserNameCheck = await User.findOne({
        userName: new RegExp(`^${req.body.userName}$`, "i"),
      }).exec();

      if (UserExistUserNameCheck) {
        throw new Error(`User with this username already exists`);
      }
    }

    if (req.body.password) {
      req.body.password = await encryptPassword(req.body.password);
    }
    const user = await new User({ ...req.body }).save();

    res
      .status(201)
      .json({
        message:
          (req.body.role && req.body.role != ""
            ? `${req.body.role}`.toLowerCase()
            : "User") + " Created",
        data: user._id,
      });
  } catch (error) {
    next(error);
  }
};

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const UserExistNameCheck = await User.findOne({
      name: new RegExp(`^${req.body.name}$`, "i"),
    }).exec();

    if (UserExistNameCheck) {
      throw new Error(`User with this name Already Exists`);
    }
    const UserExistEmailCheck = await User.findOne({
      email: new RegExp(`^${req.body.email}$`, "i"),
    }).exec();
    if (UserExistEmailCheck) {
      throw new Error(`User with this email Already Exists`);
    }

    const UserExistPhoneCheck = await User.findOne({
      phone: req.body.phone,
    }).exec();
    if (UserExistPhoneCheck) {
      throw new Error(`User with this phone Already Exists`);
    }

    if (req.body.userName && req.body.userName != "") {
      const UserExistUserNameCheck = await User.findOne({
        userName: new RegExp(`^${req.body.userName}$`, "i"),
      }).exec();

      if (UserExistUserNameCheck) {
        throw new Error(`User with this username already exists`);
      }
    }

    req.body.password = await encryptPassword(req.body.password);

    const user = await new User({ ...req.body }).save();

    res.status(201).json({ message: "Registered", data: user._id });
  } catch (error) {
    next(error);
  }
};

export const deleteUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId).exec();
    res.status(201).json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

export const approveUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, {
      approved: true,
    }).exec();
    res.status(201).json({ message: "User Approved" });
  } catch (error) {
    next(error);
  }
};

export const uploadDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new Error("Error Uploading File");
    }

    const userObj = await User.findByIdAndUpdate(req.params.userId, {
      $push: { documents: { fileName: req.file?.filename } },
    }).exec();

    if (!userObj) {
      throw new Error(`User does not exist`);
    }

    res.json({ message: "Image Uploaded", data: req.file.filename });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: any, res: any, next: any) => {
  try {
    let pipeline: PipelineStage[] = [];
    let matchObj: Record<string, any> = {};
    const { query } = req.query;
    // Handle basic search - search across multiple fields
    if (
      req.query.query &&
      typeof req.query.query === "string" &&
      req.query.query !== ""
    ) {
      matchObj.$or = [
        {
          name: {
            $regex: new RegExp(
              `${typeof req?.query?.query === "string" ? req.query.query : ""}`,
              "i"
            ),
          },
        },

   
        {
          email: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          phone: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          role: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          employeeCode: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },
        {
          displayName: new RegExp(
            typeof req?.query?.query === "string" ? req.query.query : "",
            "i"
          ),
        },

        
        //check for fullName
      ];
    }

    // Handle advanced search (same as before)
    if (req?.query?.advancedSearch && req.query.advancedSearch !== "") {
      const searchParams =
        typeof req.query.advancedSearch === "string"
          ? req.query.advancedSearch.split(",")
          : [];

      const advancedSearchConditions: any[] = [];

      searchParams.forEach((param: string) => {
        const [field, condition, value] = param.split(":");

        if (field && condition && value) {
          let fieldCondition: Record<string, any> = {};

          switch (condition) {
            case "contains":
              fieldCondition[field] = { $regex: value, $options: "i" };
              break;
            case "equals":
              fieldCondition[field] = value;
              break;
            case "startsWith":
              fieldCondition[field] = { $regex: `^${value}`, $options: "i" };
              break;
            case "endsWith":
              fieldCondition[field] = { $regex: `${value}$`, $options: "i" };
              break;
            case "greaterThan":
              fieldCondition[field] = {
                $gt: isNaN(Number(value)) ? value : Number(value),
              };
              break;
            case "lessThan":
              fieldCondition[field] = {
                $lt: isNaN(Number(value)) ? value : Number(value),
              };
              break;
            default:
              fieldCondition[field] = { $regex: value, $options: "i" };
          }

          advancedSearchConditions.push(fieldCondition);
        }
      });

      // If we have both basic and advanced search, we need to combine them
      if (matchObj.$or) {
        // If there are already $or conditions (from basic search)
        // We need to use $and to combine with advanced search
        matchObj = {
          $and: [{ $or: matchObj.$or }, { $and: advancedSearchConditions }],
        };
      } else {
        // If there's only advanced search, use $and directly
        matchObj.$and = advancedSearchConditions;
      }
    }

    // Add the match stage to the pipeline
    pipeline.push({
      $match: matchObj,
    });
    let userArr = await paginateAggregate(User, pipeline, req.query); 

    console.log(userArr, "chck arr of user");

    res.status(201).json({ message: "found all Device", data: userArr.data, total: userArr.total });
} catch (error) {
    next(error);
}
}




   

// export const getAllUsers = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     let queryObj: any = {
//       role: { $ne: ROLES.STOREINCHARGE },
//       _id: { $ne: new mongoose.Types.ObjectId(req.user?.userId) },
//     };
//     if (req.query.role && req.query.role != "undefined") {
//       queryObj.role.$eq = req.query.role;
//     }

//     console.log(req.query, "check query ")
//     if (req.query.query) {
//       queryObj = {
//         ...queryObj,
//         $or: [],
//       };

//       queryObj.$or.push({ name: new RegExp(`${req.query.searchQuery}`, "i") });
//       queryObj.$or.push({ email: new RegExp(`${req.query.searchQuery}`, "i") });
//       queryObj.$or.push({ phone: new RegExp(`${req.query.searchQuery}`, "i") });
//       queryObj.$or.push({
//         mobile: new RegExp(`${req.query.searchQuery}`, "i"),
//       });
//       queryObj.$or.push({ role: new RegExp(`${req.query.searchQuery}`, "i") });
//     }

//     let pipeline: any = [
//       {
//         $match: queryObj,
//       },
//     ];
//     // if (req.query.department == DEPARTMENT.STORES) {
//     //   pipeline.push(
//     //     {
//     //       $match: {
//     //         department: DEPARTMENT.STORES,
//     //       },
//     //     },
//     //     {
//     //       $unwind: {
//     //         path: "$rawMaterialArr",
//     //         preserveNullAndEmptyArrays: true,
//     //       },
//     //     },
//     //     {
//     //       $lookup: {
//     //         from: "rawmaterials",
//     //         localField: "rawMaterialArr.rawMaterialId",
//     //         foreignField: "_id",
//     //         as: "rawMaterialObj",
//     //       },
//     //     },
//     //     {
//     //       $unwind: {
//     //         path: "$rawMaterialObj",
//     //         preserveNullAndEmptyArrays: true,
//     //       },
//     //     },
//     //     {
//     //       $addFields: {
//     //         "rawMaterialArr.label": "$rawMaterialObj.name",
//     //         "rawMaterialArr.value": "$rawMaterialObj._id",
//     //       },
//     //     },
//     //     {
//     //       $group: {
//     //         _id: "$_id",
//     //         name: {
//     //           $first: "$name",
//     //         },
//     //         email: {
//     //           $first: "$email",
//     //         },
//     //         password: {
//     //           $first: "$password",
//     //         },
//     //         rawMaterialArr: {
//     //           $addToSet: "$rawMaterialArr",
//     //         },
//     //       },
//     //     }
//     //   );
//     // }

//     // if (req.query.isForSelectInput) {
//     //   pipeline.push({
//     //     $project: {
//     //       label: "$name",
//     //       value: "$_id",
//     //     },
//     //   });
//     // }
//     const users = await User.(pipeline);
//     res.json({ message: "ALL Users", data: users });
//   } catch (error) {
//     next(error);
//   }
// };

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json({ message: "User Data", data: req.user?.userObj });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const obj: any = {};
    if (req.body.name) {
      obj.name = req.body.name;
    }
    if (req.body.password && req.body.password != "") {
      obj.password = await encryptPassword(req.body.password);
    } else {
      delete obj.password;
    }
    if (req.body.email) {
      const user = await User.find({
        email: new RegExp(`^${req.body.email}$`, "i"),
        _id: { $ne: req.user?.userId },
      }).exec();
      if (user.length) {
        throw new Error("This email is already being used");
      }

      obj.email = req.body.email;
    }
    if (req.body.address) {
      obj.address = req.body.address;
    }
    // if (req.body.name) {
    //   obj.name = req.body.name;
    // }

    const user = await User.findByIdAndUpdate(req.user?.userId, obj, {
      new: true,
    }).exec();
    if (!user) throw new Error("User Not Found");
    res.json({ message: "Updated" });
  } catch (error) {
    next(error);
  }
};
export const updateUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    console.log(req.params.id, "check id")
    const user = await User.findById(req?.params.id).exec();
    if (!user) {
      throw new Error("User does not exists");
    }

    let nameExists = await User.findOne({
      name: new RegExp(`^${req.body.name}$`, "i"),
      _id: { $ne: new mongoose.Types.ObjectId(req.params.id) },
    })
      .lean()
      .exec();
    if (nameExists) {
      throw new Error(
        "Name you are trying to add already exists in our database for another user"
      );
    }
    // let phoneExists = await User.findOne({phone:new RegExp(`^${req.body.phone}$`, "i"), _id:{$ne:new mongoose.Types.ObjectId(req.params.id)}}).lean().exec();
    // if (phoneExists) {
    // 	throw new Error("Phone number you are trying to add already exists in our database for another user");
    // }
    let emailExists = await User.findOne({
      email: new RegExp(`^${req.body.email}$`, "i"),
      _id: { $ne: new mongoose.Types.ObjectId(req.params.id) },
    })
      .lean()
      .exec();
    if (emailExists) {
      throw new Error(
        "Email you are trying to add already exists in our database for another user"
      );
    }

    if (req.body.userName && req.body.userName != "") {
      const UserExistUserNameCheck = await User.findOne({
        userName: new RegExp(`^${req.body.userName}$`, "i"),
      }).exec();

      if (UserExistUserNameCheck) {
        throw new Error(`User with this username already exists`);
      }
    }

    if (req.body.password && req.body.password != "") {
      req.body.password = await encryptPassword(req.body.password);
    } else {
      delete req.body.password;
    }

    await User.findByIdAndUpdate(req?.params?.id, req.body, {
      new: true,
    }).exec();
    if (!user) throw new Error("User Not Found");
    res.json({ message: "Updated" });
  } catch (error) {
    next(error);
  }
};

export const UpdatePasswordByAuthorizeId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    console.log(req.body , "check body")

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirmation do not match" });
    }

    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const isOldPasswordValid = await comparePassword(user.password, oldPassword );
    if (!isOldPasswordValid) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    const encryptedPassword = await encryptPassword(newPassword);
    user.password = encryptedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let user: any = await User.findById(req?.params?.id).lean().exec();
    if (!user) {
      throw new Error("User does not exists");
    }

    const token = await generateAccessJwt({
      userId: user._id,
      role: user.role,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        _id: user._id,
        accessObj: user.accessObj,
      },
    });

    if (user.role == DEPARTMENT.STORES) {
      let pipeline = [
        {
          $match: {
            department: DEPARTMENT.STORES,
            _id: new mongoose.Types.ObjectId(req?.params?.id),
          },
        },
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
            "rawMaterialArr.label": "$rawMaterialObj.name",
            "rawMaterialArr.value": "$rawMaterialObj._id",
          },
        },
        {
          $group: {
            _id: "$_id",
            name: {
              $first: "$name",
            },
            email: {
              $first: "$email",
            },
            password: {
              $first: "$password",
            },
            rawMaterialArr: {
              $addToSet: "$rawMaterialArr",
            },
          },
        },
      ];
      let tempUser = await User.aggregate(pipeline);
      if (tempUser && tempUser.length == 0) {
        throw new Error("User not found");
      }
      user = tempUser[0];
    }

    res.json({ message: "found user", data: user, token });
  } catch (error) {
    next(error);
  }
};

export const getAllUserName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Fetch only required fields from the database
    const users = await User.find().select({ name: 1, _id: 1 });



    console.log(users, "users");
    // Transforming the vendor list
    const userNames = users.map((v: any) => ({
      label: `${v.name}`,
      value: `${v._id}`,

    }));


    res.status(200).json({
      message: "Found all vendor names",
      data: userNames,
      total: userNames.length,
    });
  } catch (error) {
    next(error);
  }
};
export const downloadExcelUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isSelectedExport =
    req.body.tickRows &&
    Array.isArray(req.body.tickRows) &&
    req.body.tickRows.length > 0;

  return ExportService.downloadFile(req, res, next, {
    model: User,
    buildQuery: buildUserQuery,
    formatData: formatUserData,
    processFields: processUserFields,
    filename: isSelectedExport ? "selected_users" : "users",
    worksheetName: isSelectedExport ? "Selected Users" : "All Users",
    title: isSelectedExport ? "Selected Users" : "User List",
  });
};

const buildUserQuery = (req: Request) => {
  const query: any = {};

  // Handle selected rows export
  if (req.body.tickRows?.length > 0) {
    query._id = { $in: req.body.tickRows };
    return query;
  }

  // Apply regular filters
  if (req.body.role) {
    query.role = req.body.role;
  }

  if (req.body.department) {
    query.department = req.body.department;
  }

  if (req.body.approved !== undefined) {
    query.approved = req.body.approved;
  }

  if (req.body.storeId) {
    query.storeId = req.body.storeId;
  }

  if (req.body.dateFrom && req.body.dateTo) {
    query.createdAt = {
      $gte: new Date(req.body.dateFrom),
      $lte: new Date(req.body.dateTo),
    };
  }

  if (req.body.search) {
    query.$or = [
      { name: { $regex: req.body.search, $options: "i" } },
      { email: { $regex: req.body.search, $options: "i" } },
      { employeeCode: { $regex: req.body.search, $options: "i" } },
      { displayName: { $regex: req.body.search, $options: "i" } },
    ];
  }

  return query;
};

const formatUserData = (user: any) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    approved: user.approved ? 'Yes' : 'No',
    employeeCode: user.employeeCode,
    displayName: user.displayName,
    reportsTo: user.reportsToId?.toString() || '',
    store: user.storeId?.toString() || '',
    canManageUsers: user.accessObj?.manageUsers ? 'Yes' : 'No',
    canManageCategory: user.accessObj?.manageCategory ? 'Yes' : 'No',
    rawMaterialsCount: user.rawMaterialArr?.length || 0,
    createdAt: user.createdAt.toLocaleDateString(),
    updatedAt: user.updatedAt?.toLocaleDateString() || '',
  };
};

const processUserFields = (fields: string[]) => {
  const fieldMapping = {
    id: { key: "id", header: "ID", width: 20 },
    name: { key: "name", header: "Full Name", width: 25 },
    email: { key: "email", header: "Email", width: 30 },
    phone: { key: "phone", header: "Phone", width: 20 },
    role: { key: "role", header: "Role", width: 15 },
    department: { key: "department", header: "Department", width: 20 },
    approved: { key: "approved", header: "Approved", width: 10 },
    employeeCode: { key: "employeeCode", header: "Employee Code", width: 15 },
    displayName: { key: "displayName", header: "Display Name", width: 20 },
    reportsTo: { key: "reportsTo", header: "Reports To", width: 20 },
    store: { key: "store", header: "Store ID", width: 20 },
    canManageUsers: { key: "canManageUsers", header: "Can Manage Users", width: 15 },
    canManageCategory: { key: "canManageCategory", header: "Can Manage Categories", width: 20 },
    rawMaterialsCount: { key: "rawMaterialsCount", header: "Raw Materials Count", width: 15 },
    createdAt: { key: "createdAt", header: "Created At", width: 15 },
    updatedAt: { key: "updatedAt", header: "Updated At", width: 15 },
  };

  return fields.length === 0
    ? Object.values(fieldMapping)
    : fields
        .map((field) => fieldMapping[field as keyof typeof fieldMapping])
        .filter(Boolean);
};

export const downloadUserTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("User Template", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Define columns
    worksheet.columns = [
      { header: "Name*", key: "name", width: 25 },
      { header: "Email*", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Role*", key: "role", width: 15 },
      { header: "Department*", key: "department", width: 20 },
      { header: "Employee Code*", key: "employeeCode", width: 15 },
      { header: "Display Name", key: "displayName", width: 20 },
      { header: "Reports To ID", key: "reportsToId", width: 20 },
      { header: "Store ID", key: "storeId", width: 20 },
      { header: "Approved", key: "approved", width: 10 },
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add data validation
    ['D2', 'E2', 'J2'].forEach(cell => {
      worksheet.getCell(cell).dataValidation = {
        type: "list",
        allowBlank: cell === 'J2',
        formulae: [
          cell === 'D2' 
            ? '"admin,manager,supervisor,employee"'
            : cell === 'E2'
              ? '"operations,sales,warehouse,hr,finance"'
              : '"true,false"'
        ],
      };
    });

    // Add sample data
    worksheet.addRow({
      name: "John Doe",
      email: "john.doe@example.com",
      role: "manager",
      department: "operations",
      employeeCode: "EMP1001",
      approved: "true"
    });

    // Add instructions sheet
    const instructionSheet = workbook.addWorksheet("Instructions");
    instructionSheet.columns = [
      { header: "Field", key: "field", width: 20 },
      { header: "Description", key: "description", width: 50 },
      { header: "Required", key: "required", width: 10 },
    ];

    instructionSheet.getRow(1).font = { bold: true };
    instructionSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const instructions = [
      { field: "Name", description: "User's full name", required: "Yes" },
      { field: "Email", description: "User's email address", required: "Yes" },
      { field: "Phone", description: "User's phone number", required: "No" },
      { field: "Role", description: "User's role in system", required: "Yes" },
      { field: "Department", description: "User's department", required: "Yes" },
      { field: "Employee Code", description: "Unique employee identifier", required: "Yes" },
      { field: "Display Name", description: "Name to show in system", required: "No" },
      { field: "Reports To ID", description: "Manager's user ID", required: "No" },
      { field: "Store ID", description: "Assigned store ID", required: "No" },
      { field: "Approved", description: "Whether user is approved", required: "No" },
    ];

    instructions.forEach(inst => instructionSheet.addRow(inst));

    // Generate file
    const filename = `user_import_template_${Date.now()}.xlsx`;
    const filePath = path.join("public", "uploads", filename);
    
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await workbook.xlsx.writeFile(filePath);

    res.json({
      status: "success",
      message: "Template downloaded",
      filename,
    });
  } catch (error) {
    console.error("User template generation failed:", error);
    next(error);
  }
};