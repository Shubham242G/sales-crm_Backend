import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addPurchaseContact, deletePurchaseContactById, getAllPurchaseContact, getPurchaseContactById, updatePurchaseContactById, downloadExcelPurchaseContact, BulkUploadPurchaseContact, convertEnquiry } from '../controllers/purchaseContact.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addPurchaseContact);
router.get('/', getAllPurchaseContact);
router.get('/getById/:id', getPurchaseContactById);
router.patch('/updateById/:id', updatePurchaseContactById);
router.delete('/deleteById/:id', deletePurchaseContactById);
router.post("/bulkUploadPurchaseContacts", upload.single('file'), BulkUploadPurchaseContact);
router.get('/getExel', downloadExcelPurchaseContact);
router.post('/convert/:id', convertEnquiry);

export default router;