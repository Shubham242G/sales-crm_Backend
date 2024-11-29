import { Document, Model, PipelineStage, Types } from "mongoose";// Import necessary types from mongoose
import _ from "lodash"; // Import lodash for deep cloning

/**
 * Paginates and aggregates data from a Mongoose model.
 * @param model - The Mongoose model to aggregate data from.
 * @param pipeline - The aggregation pipeline to execute.
 * @param query - The query parameters for pagination.
 * @returns An object containing the paginated data and the total count.
 */
export async function paginateAggregate<T = unknown>(
  model: Model<T, {}, {}, {}, Document<unknown, {}, T> & T & { _id: Types.ObjectId }, any>, // Type of the model
  pipeline: PipelineStage[], // Aggregation pipeline
  query: any, // Query parameters for pagination
) {
  // Initialize the result object with empty data array and total count of 0
  const obj: { data: unknown[]; total: number } = {
    data: [],
    total: 0,
  };

  // Process the query to get pagination details
  const pagination = paginationProcessor(query);
  // Clone the original pipeline to use it for counting documents
  const countPipeline = _.cloneDeep(pipeline);

  
  
  if(query.forSelect){
    pipeline.push({
      $project:{
        "label":"$name",
        "value":"$_id",
        "_id":0,
      }
    })
  }
  else{
    // Add skip and limit stages to the pipeline for pagination
  pipeline.push(
    {
      $skip: pagination.skip,
    },
    {
      $limit: pagination.pageSize,
    },
  );
  }


  // Execute the aggregation pipeline to get paginated data
  obj.data = await model.aggregate(pipeline);

  // Add a count stage to the cloned pipeline to count the total number of documents
  countPipeline.push({
    $count: "count",
  });
  // Execute the count pipeline to get the total document count
  let countResult = await model.aggregate(countPipeline);
  obj.total = countResult.length > 0 ? countResult[0].count : 0; // If count result is not empty, set the total

  return obj; // Return the result object with data and total count
}

/**
 * Processes pagination query parameters.
 * @param query - The query parameters for pagination.
 * @param pageSizeKey - The key for page size in the query parameters.
 * @param pageIndexKey - The key for page index in the query parameters.
 * @returns An object containing pageIndex, pageSize, and skip values.
 */
export const paginationProcessor = (
  query: any,
  pageSizeKey: string = "pageSize",
  pageIndexKey: string = "pageIndex",
) => {
  // Parse the pageSize from query parameters, default to 100 if invalid
  let pageSize = parseInt(query[pageSizeKey]);
  // Parse the pageIndex from query parameters, default to 0 if invalid
  let pageIndex = parseInt(query[pageIndexKey]);

  if (isNaN(pageSize)) {
    pageSize = 100; // Default page size if not provided or invalid
  }

  if (isNaN(pageIndex)) {
    pageIndex = 0; // Default page index if not provided or invalid
  }

  return {
    pageIndex,
    pageSize,
    skip: pageIndex * pageSize, // Calculate the number of documents to skip
  };
};