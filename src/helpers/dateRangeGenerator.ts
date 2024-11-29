export function generateDateRange(startDate:Date, endDate:Date) {
    const start = new Date(startDate);
    start.setDate(start.getDate() +1)
    const end = new Date(endDate);
    end.setDate(end.getDate() +1)
    const dateArray = [];
    let currentDate = start;

    while (currentDate <= end) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray.map(date => date.toISOString().split('T')[0]);
}

export const returnUTCDate = (dateval:Date)=> {
    var istDate = new Date(dateval); // Replace 'YYYY-MM-DDTHH:MM:SS' with your IST date and time

    // Get the timezone offset for IST in minutes
    var istOffset = 330; // IST is 5 hours and 30 minutes ahead of UTC, which is equivalent to 330 minutes
    
    // Convert the IST time to UTC time
    var utcTime = new Date(istDate.getTime() - (istOffset * 60000));

    return utcTime
}