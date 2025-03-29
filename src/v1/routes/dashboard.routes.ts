import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addDashboard, deleteDashboardById, getDashboardById, updateDashboardById, getAllDashboard, BulkUploadDashboard, downloadExcelDashboard, getAllDashboardName} from '../controllers/dashboard.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addDashboard);
router.get('/', getAllDashboard);
router.get('/getById/:id', getDashboardById);
router.patch('/updateById/:id', updateDashboardById);
router.delete('/deleteById/:id', deleteDashboardById);
router.post("/bulkUploadDashboards", upload.single('file'), BulkUploadDashboard);
router.get('/getExel', downloadExcelDashboard);
router.get("/getAllDashboardName", getAllDashboardName);


export default router;





