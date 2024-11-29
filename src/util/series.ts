import {
  SERIES_FOR_TYPE,
  SERIES_GENERATOR_CONFIG,
  SERIES_TYPE_TYPE,
} from "@common/constant.common";
import { ISeries, Series } from "@models/series.model";
import { format } from "date-fns";

function getSeriesConfig(series_for: SERIES_FOR_TYPE, series_type?: SERIES_TYPE_TYPE) {
  return SERIES_GENERATOR_CONFIG.find((el) => {
    if (series_type) {
      return el.series_for === series_for && el.series_type === series_type
    }
    return el.series_for === series_for && !el.series_type
  });
}

/**
 * Use this function to get the last value that was generated
 */
export async function getLatestInSeries(series_for: SERIES_FOR_TYPE, series_type?: SERIES_TYPE_TYPE) {
  try {
    const config = getSeriesConfig(series_for, series_type);

    // if (!config) {
    //   throw new Error("Send valid series details");
    // }

    // let findObj: Record<string, any> = {
    //   str: config.str,
    // };

    // if (config.financialYear) {

    //   let year = Number(format(new Date(), "yy"))


    //   if (new Date().getMonth() <= 2) {
    //     year = year - 1
    //   }

    //   findObj.financialYear = `${year}-${year + 1}`



    // } else {
    //   findObj.financialYear = {
    //     $exists: false,
    //   };
    // }

    // const data = await Series.findOne(findObj).lean().exec();
    // return data?.latestValue;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Use this function to generate a new value
 */
export async function getNewValueForSeries(series_for: SERIES_FOR_TYPE, series_type?: SERIES_TYPE_TYPE) {
  try {
    console.log(series_for,series_type,"series_type")
    const config = getSeriesConfig(series_for, series_type);
    if (!config) {
      throw new Error("Send valid series details");
    }

    let findObj: Record<string, any> = {
      str: config.str,
    };
    let updateObj: Record<string, any> = {};

    if (config.financialYear) {

      let year = Number(format(new Date(), "yy"))
      if (new Date().getMonth() <= 2) {
        year = year - 1
      }

      findObj.financialYear = `${year}-${year + 1}`

    } else {
      findObj.financialYear = {
        $exists: false,
      };
    }

    if (config.counter) {
      if (!updateObj.$inc) {
        updateObj.$inc = {};
      }
      updateObj.$inc = {
        ...updateObj.$inc,
        count: 1,
      };
    }

    const data = await Series.findOneAndUpdate(findObj, updateObj, { new: true, }).lean().exec();
    if (data) {
      let latestValue: string = config.str

      if (config.counter) {
        latestValue = latestValue.replace("{counter}", String(data.count).padStart(4, "0"))
      }

      if (config.financialYear && data.financialYear) {
        latestValue = latestValue.replace("{financialYear}", data.financialYear)
      }

      await Series.findByIdAndUpdate(data._id, { latestValue: latestValue }).lean().exec()
      return latestValue

    }

    // create new entry 

    let newData: ISeries = {
      str: config.str,
      latestValue: config.str,
    };

    if (config.counter) {
      newData.count = 1
      newData.latestValue = newData.latestValue.replace("{counter}", String(newData.count).padStart(4, "0"))
    }

    if (config.financialYear) {
      let year = Number(format(new Date(), "yy"))
      if (new Date().getMonth() <= 2) {
        year = year - 1
      }
      newData.financialYear = `${year}-${year + 1}`
      newData.latestValue = newData.latestValue.replace("{financialYear}", newData.financialYear)
    }

    await Series.create(newData)
    return newData.latestValue

  } catch (error) {
    console.error("error in getNewValueForSeries", error);
    throw error;
  }
}
