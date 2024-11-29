import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "@models/user.model";
import { CONFIG } from "@common/config.common";

export const authorizeJwt: RequestHandler = async (req:any, res, next) => {
  req.user = undefined;
  const authorization = req.headers["authorization"];
  let token = authorization && authorization.split("Bearer ")[1];
  if (!token && typeof req.query.token == "string") {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Invalid Token" });
  }

  try {
    jwt.verify(token, CONFIG.JWT_ACCESS_TOKEN_SECRET,async (err: any, response: any) => {
      if (err) {
        return res.status(401).json({ message: "Expired Token" });
      }
      req.user = response
      if (response) {
        req.user.userId = response.userId;
        req.user.userObj = await User.findById(response.userId).exec();
      }
    });

    next();
  } catch (e) {
    console.error(e);
    res.status(401).json({ message: "Token is expired" });
  }
};

export const setUserAndUserObj: RequestHandler = async (req, res, next) => {
  // console.log(req.headers);

  const authorization = req.headers["authorization"];
  let token = authorization && authorization.split("Bearer ")[1];
  if (!token && typeof req.query.token == "string") {
    token = req.query.token;
  }
  if (token) {
    try {
      // Verify token
      const decoded: any = jwt.verify(token, CONFIG.JWT_ACCESS_TOKEN_SECRET);
      // Add user from payload
      if (decoded) {
        req.user = decoded;
      }

      if (req.user) {
        req.user.userObj = await User.findById(decoded.userId).exec();
      }
    } catch (e) {
      console.error(e);
      // return res.status(401).json({ message: "Invalid Token" });
    }
  }
  next();
};
