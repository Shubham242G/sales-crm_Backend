import { comparePassword, encryptPassword } from "@helpers/bcrypt";
import { generateAccessJwt, generateRefreshJwt } from "@helpers/jwt";
import { User } from "@models/user.model";
import { Request, Response, NextFunction } from "express";
import { addLogs } from "@helpers/addLog";
import mongoose, { PipelineStage } from "mongoose";
import { DEPARTMENT, ROLES } from "@common/constant.common";
import { paginateAggregate } from "@helpers/paginateAggregate";

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
    if (req.query.query && req.query.query != "") {
        matchObj.name = new RegExp(req.query.query, "i");
    }
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
