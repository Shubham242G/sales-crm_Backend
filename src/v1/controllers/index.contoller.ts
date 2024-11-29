import { RequestHandler } from "express";

export const IndexGet: RequestHandler = async (req, res, next) => {
  try {
    res.send("In Index Route");
  } catch (error) {
    next(error);
  }
};
