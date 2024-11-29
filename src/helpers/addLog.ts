import { Log } from "@models/log.model"

export const addLogs = async (event: any, name: any, email: any) => {
    try {
        const newLog = await new Log({
            event,
            name, 
            email
        }).save(); 
    } catch (error) {
        console.log(error,'Error Addlog Helper');
        return error;
    }
}