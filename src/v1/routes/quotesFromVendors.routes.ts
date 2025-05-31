import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addQuotesFromVendors, getAllQuotesFromVendors, getQuotesFromVendorsById,deleteQuotesFromVendorsById, updateQuotesFromVendorsById, convertQuotesFromVendorToQuotesToCustomer, downloadQuotesTemplate } from '../controllers/quotesFromVendors.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addQuotesFromVendors);
router.get('/', getAllQuotesFromVendors);
router.get('/getById/:id', getQuotesFromVendorsById);
router.patch('/updateById/:id', updateQuotesFromVendorsById);
router.delete('/deleteById/:id', deleteQuotesFromVendorsById);
router.post('/getExcel', downloadQuotesTemplate)

router.post('/convert/:id', convertQuotesFromVendorToQuotesToCustomer);


// router.post("/BulkUploadContacts", upload.single('file'), BulkUploadQuotesFromVendors);
// router.get('/getExel', downloadExcelQuotesFromVendors);



export default router;