import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addQuotesFromVendors, getAllQuotesFromVendors, getQuotesFromVendorsById,deleteQuotesFromVendorsById, updateQuotesFromVendorsById, convertQuotesFromVendors } from '../controllers/quotesFromVendors.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addQuotesFromVendors);
router.get('/', getAllQuotesFromVendors);
router.get('/getById/:id', getQuotesFromVendorsById);
router.patch('/updateById/:id', updateQuotesFromVendorsById);
router.delete('/deleteById/:id', deleteQuotesFromVendorsById);
router.post('/convert/:id', convertQuotesFromVendors);


// router.post("/BulkUploadContacts", upload.single('file'), BulkUploadQuotesFromVendors);
// router.get('/getExel', downloadExcelQuotesFromVendors);



export default router;