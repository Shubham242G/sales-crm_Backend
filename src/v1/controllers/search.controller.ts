// import { Request, Response, NextFunction } from 'express';
// import mongoose, { PipelineStage } from 'mongoose';
// import { paginateResults } from '../helpers/pagination';

// /**
//  * Generic search controller that can be used across different models
//  */
// export const genericSearchController = (Model: mongoose.Model<any>) => {
//     return async (req: Request, res: Response, next: NextFunction) => {
//         try {
//             // Extract search parameters from request
//             const {
//                 query = '',               // Basic search query
//                 page = 1,                 // Pagination: current page
//                 limit = 10,               // Pagination: items per page
//                 sortField = 'createdAt',  // Default sort field
//                 sortOrder = -1,           // Default sort order (descending)
//                 advancedSearch = null,    // Advanced search params (JSON string)
//                 fields = null,            // Fields to return
//             } = req.query;

//             // Base pipeline stages
//             const pipeline: PipelineStage[] = [];

//             // Basic search
//             if (query && typeof query === 'string' && query.trim() !== '') {
//                 // Get all searchable text fields from the model
//                 const textFields = Object.keys(Model.schema.paths).filter(
//                     path => Model.schema.paths[path].instance === 'String'
//                 );

//                 if (textFields.length > 0) {
//                     // Create OR conditions for each text field
//                     const orConditions = textFields.map(field => ({
//                         [field]: { $regex: query, $options: 'i' }
//                     }));

//                     pipeline.push({ $match: { $or: orConditions } });
//                 }
//             }

//             // Advanced search
//             if (advancedSearch) {
//                 try {
//                     const advancedParams = JSON.parse(advancedSearch as string);
//                     const advancedQuery: Record<string, any> = {};

//                     // Process each field in the advanced search
//                     Object.entries(advancedParams).forEach(([field, criteria]) => {
//                         if (!criteria) return;

//                         const schemaType = Model.schema.paths[field]?.instance;

//                         // Handle different types of fields differently
//                         switch (schemaType) {
//                             case 'String':
//                                 if (criteria.operator === 'equals') {
//                                     advancedQuery[field] = criteria.value;
//                                 } else if (criteria.operator === 'contains') {
//                                     advancedQuery[field] = { $regex: criteria.value, $options: 'i' };
//                                 } else if (criteria.operator === 'startsWith') {
//                                     advancedQuery[field] = { $regex: `^${criteria.value}`, $options: 'i' };
//                                 } else if (criteria.operator === 'endsWith') {
//                                     advancedQuery[field] = { $regex: `${criteria.value}$`, $options: 'i' };
//                                 }
//                                 break;

//                             case 'Number':
//                                 if (criteria.operator === 'equals') {
//                                     advancedQuery[field] = Number(criteria.value);
//                                 } else if (criteria.operator === 'greaterThan') {
//                                     advancedQuery[field] = { $gt: Number(criteria.value) };
//                                 } else if (criteria.operator === 'lessThan') {
//                                     advancedQuery[field] = { $lt: Number(criteria.value) };
//                                 } else if (criteria.operator === 'between') {
//                                     advancedQuery[field] = {
//                                         $gte: Number(criteria.minValue),
//                                         $lte: Number(criteria.maxValue)
//                                     };
//                                 }
//                                 break;

//                             case 'Date':
//                                 if (criteria.operator === 'equals') {
//                                     const date = new Date(criteria.value);
//                                     advancedQuery[field] = {
//                                         $gte: new Date(date.setHours(0, 0, 0, 0)),
//                                         $lte: new Date(date.setHours(23, 59, 59, 999))
//                                     };
//                                 } else if (criteria.operator === 'before') {
//                                     advancedQuery[field] = { $lt: new Date(criteria.value) };
//                                 } else if (criteria.operator === 'after') {
//                                     advancedQuery[field] = { $gt: new Date(criteria.value) };
//                                 } else if (criteria.operator === 'between') {
//                                     advancedQuery[field] = {
//                                         $gte: new Date(criteria.startDate),
//                                         $lte: new Date(criteria.endDate)
//                                     };
//                                 }
//                                 break;

//                             case 'Boolean':
//                                 advancedQuery[field] = criteria.value === 'true';
//                                 break;

//                             case 'ObjectID':
//                                 advancedQuery[field] = new mongoose.Types.ObjectId(criteria.value);
//                                 break;

//                             // For array fields
//                             case 'Array':
//                                 if (criteria.operator === 'contains') {
//                                     advancedQuery[field] = { $in: [criteria.value] };
//                                 }
//                                 break;
//                         }
//                     });

//                     if (Object.keys(advancedQuery).length > 0) {
//                         pipeline.push({ $match: advancedQuery });
//                     }
//                 } catch (error) {
//                     console.error('Error parsing advanced search params:', error);
//                 }
//             }

//             // Add sort stage
//             pipeline.push({
//                 $sort: { [sortField as string]: parseInt(sortOrder as string) }
//             });

//             // Field selection (projection)
//             if (fields && typeof fields === 'string') {
//                 try {
//                     const fieldList = fields.split(',');
//                     const projection: Record<string, number> = {};

//                     fieldList.forEach(field => {
//                         projection[field.trim()] = 1;
//                     });

//                     pipeline.push({ $project: projection });
//                 } catch (error) {
//                     console.error('Error parsing fields:', error);
//                 }
//             }

//             // Execute the search with pagination
//             const results = await paginateResults(
//                 Model,
//                 pipeline,
//                 parseInt(page as string),
//                 parseInt(limit as string)
//             );

//             return res.status(200).json({
//                 success: true,
//                 data: results.data,
//                 pagination: {
//                     total: results.total,
//                     page: parseInt(page as string),
//                     limit: parseInt(limit as string),
//                     pages: Math.ceil(results.total / parseInt(limit as string))
//                 }
//             });

//         } catch (error) {
//             next(error);
//         }
//     };
// };

// // Example usage with specific model

// export const searchEnquiries = genericSearchController(Enquiry);