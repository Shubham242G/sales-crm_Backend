import express from "express";
import { Types } from "mongoose";
import { IUser } from "@models/user.model";
import { ROLES_TYPE } from "@common/constant.common";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: Types.ObjectId | string;
        role: ROLES_TYPE;
        user: {
          name: string;
          email: string;
          phone: string;
          _id: Types.ObjectId | string;
        };
        userObj?: IUser | undefined | null;
      };
    }
  }
}
