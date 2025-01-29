import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addSalesContact, deleteSalesContactById, getAllSalesContact, getSalesContactById, updateSalesContactById, downloadExcelSalesContact, BulkUploadSalesContact, convertEnquiry } from '../controllers/salesContact.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addSalesContact);
router.get('/', getAllSalesContact);
router.get('/getById/:id', getSalesContactById);
router.patch('/updateById/:id', updateSalesContactById);
router.delete('/deleteById/:id', deleteSalesContactById);
router.post("/bulkUploadSalesContacts", upload.single('file'), BulkUploadSalesContact);
router.get('/getExel', downloadExcelSalesContact);
router.post('/convert/:id', convertEnquiry);

export default router;