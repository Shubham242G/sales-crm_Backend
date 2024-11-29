import moment from "moment";

export const  generatePPCNumber=(prefix:string,sequenceNumber:number)=> {
    // Get current financial year

    let today = new Date();


    if(today.getMonth()-1 < 2){
        today.setFullYear(today.getFullYear() -1)
    }


    const currentYear = moment(today).format('YY');
    



    
    const nextYear = moment().add(1, 'year').format('YY');
    
    const financialYear = `${currentYear}-${nextYear}`;




    // Generate sequence number with leading zeros
    const sequence = sequenceNumber.toString().padStart(4, '0');
    // Increment sequence number for next call
    // sequenceNumber++;

    // Construct the final string
    const result = `${prefix}${sequence}/${financialYear}`;
    return result;
}
