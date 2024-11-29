import { Request, Response, NextFunction } from "express";
import { Log } from "@models/log.model";

export const getLogs =  async (req: Request, res: Response, next: NextFunction) => {
    try {

        const logsArr = await Log.find({}).exec();

        res.json({ success: true, message: "all Logs", data: logsArr });
    } catch (error) {
        next(error);
    }
};
