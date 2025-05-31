import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addQuotesToCustomer, getAllQuotesToCustomer, getQuotesToCustomerById,deleteQuotesToCustomerById, updateQuotesToCustomerById, downloadQuotesTemplate } from '../controllers/quotesToCustomer.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addQuotesToCustomer);
router.get('/', getAllQuotesToCustomer);
router.get('/getById/:id', getQuotesToCustomerById);
router.patch('/updateById/:id', updateQuotesToCustomerById);
router.delete('/deleteById/:id', deleteQuotesToCustomerById);
router.post('/getExcel', downloadQuotesTemplate)
// router.post('/convert/:id', convertQuotesToCustomer);


// router.post("/BulkUploadContacts", upload.single('file'), BulkUploadQuotesToCustomer);
// router.get('/getExel', downloadExcelQuotesToCustomer);



export default router;