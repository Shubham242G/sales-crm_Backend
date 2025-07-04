import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addEnquiry, deleteEnquiryById, getAllEnquiry, getEnquiryById, updateEnquiryById, BulkUploadEnquiry, 
  downloadExcelEnquiry, convertRfp} from '../controllers/enquiry.controller';
import { upload } from '@middlewares/multer.middleware';

const router = express.Router();

router.post('/', addEnquiry);
router.get('/', getAllEnquiry);
router.get('/getById/:id', getEnquiryById);
router.patch('/updateById/:id', updateEnquiryById);
router.delete('/deleteById/:id', deleteEnquiryById);
router.post("/bulkUploadEnquiries", upload.single('file'), BulkUploadEnquiry);
router.post('/getExcel', downloadExcelEnquiry);


// router.post('/convert/:id', convertRpf);
router.post('/convert/:id', convertRfp);

export default router;