import { Log } from "@models/log.model";
import { Response, Request, NextFunction } from "express";


export const addLog = ({ eventName } : {eventName:string, }) => async (req: Request, res: Response, next: NextFunction) =>  {
    try {
        
       const newLog = await new Log({
            name: req?.user?.userObj?.name,
            email: req?.user?.userObj?.email,
            event: eventName
       }).save();

       

        next();
    } catch (error) {
        console.log(error, "ERROR IN LOGCREATE MIDDLEWARE...")
        next(error);
    }
}