import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addDailyActivityReport, deleteDailyActivityReportById, getDailyActivityReportById, updateDailyActivityReportById, getAllDailyActivityReport } from '../controllers/dailyActivityReport.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addDailyActivityReport);
router.get('/', getAllDailyActivityReport);
router.get('/getById/:id', getDailyActivityReportById);
router.patch('/updateById/:id', updateDailyActivityReportById);
router.delete('/deleteById/:id', deleteDailyActivityReportById);
// router.post("/convert/:id", convertToContact)
// router.post("/bulkUploadLeads", upload.single('file'), BulkUploadLead);
// router.get('/getExel', downloadExcelLead);

export default router;