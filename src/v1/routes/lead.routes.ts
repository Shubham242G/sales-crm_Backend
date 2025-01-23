import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addLead, deleteLeadById, getLeadById, updateLeadById, getAllLead } from '../controllers/lead.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addLead);
router.get('/', getAllLead);
router.get('/getById/:id', getLeadById);
router.patch('/updateById/:id', updateLeadById);
router.delete('/deleteById/:id', deleteLeadById);

export default router;