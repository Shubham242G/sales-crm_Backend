export const returnMaximumLengthOfSubArray = (arr: any[], subArrName: string) => {
    let largestNumber = 0;

    for (let i = 0; i < arr.length; i++) {
        const element = arr[i];

        if (element[subArrName].length > largestNumber) {
            largestNumber = element[subArrName].length;
        }
    }
    return largestNumber
};
