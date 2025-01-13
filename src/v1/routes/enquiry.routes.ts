import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addEnquiry, deleteEnquiryById, getAllEnquiry, getEnquiryById, updateEnquiryById, downloadExcelEnquiry, BulkUploadEnquiry, convertRpf } from '../controllers/enquiry.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addEnquiry);
router.get('/', getAllEnquiry);
router.get('/getById/:id', getEnquiryById);
router.patch('/updateById/:id', updateEnquiryById);
router.delete('/deleteById/:id', deleteEnquiryById);
router.post("/BulkUploadContacts", upload.single('file'), BulkUploadEnquiry);
router.get('/getExel', downloadExcelEnquiry);
router.post('/convert/:id', convertRpf);

export default router;