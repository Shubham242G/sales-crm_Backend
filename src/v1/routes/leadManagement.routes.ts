import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addLeadManagement, deleteLeadManagementById, getLeadManagementById, updateLeadManagementById, getAllLeadManagement,  } from '../controllers/leadManagement.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addLeadManagement);
router.get('/', getAllLeadManagement);
router.get('/getById/:id', getLeadManagementById);
router.patch('/updateById/:id', updateLeadManagementById);
router.delete('/deleteById/:id', deleteLeadManagementById);




export default router;