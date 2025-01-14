import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addCustomer, deleteCustomerById, getCustomerById, updateCustomerById, getAllCustomer } from '../controllers/customer.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addCustomer);
router.get('/', getAllCustomer);
router.get('/getById/:id', getCustomerById);
router.patch('/updateById/:id', updateCustomerById);
router.delete('/deleteById/:id', deleteCustomerById);

export default router;