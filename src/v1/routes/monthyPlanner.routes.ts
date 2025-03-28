import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { upload } from '@middlewares/multer.middleware';
import { addMonthlyPlanner, getAllMonthlyPlanner, getMonthlyPlannerById, updateMonthlyPlannerById, deleteMonthlyPlannerById, getAllMonthlyPlannerName } from '@controllersv1/monthlyPlanner.controller';
const router = express.Router();


router.post('/', addMonthlyPlanner);
router.get('/', getAllMonthlyPlanner);
router.get('/getById/:id', getMonthlyPlannerById);
router.patch('/updateById/:id', updateMonthlyPlannerById);
router.delete('/deleteById/:id', deleteMonthlyPlannerById);
// router.post("/bulkUploadMonthlyPlanners", upload.single('file'), BulkUploadMonthlyPlanner);
// router.get('/getExel', downloadExcelMonthlyPlanner);
router.get("/getAllMonthlyPlannerName", getAllMonthlyPlannerName);


export default router;