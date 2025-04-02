import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addStatus, deleteStatusById, getStatusById, updateStatusById, getAllStatus } from '../controllers/status.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addStatus);
router.get('/', getAllStatus);
router.get('/getById/:id', getStatusById);
router.patch('/updateById/:id', updateStatusById);
router.delete('/deleteById/:id', deleteStatusById);

export default router;