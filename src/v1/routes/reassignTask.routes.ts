import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addReassignTask, deleteReassignTaskById, getReassignTaskById, updateReassignTaskById, getAllReassignTask} from '../controllers/reassignTask.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addReassignTask);
router.get('/', getAllReassignTask);
router.get('/getById/:id', getReassignTaskById);
router.patch('/updateById/:id', updateReassignTaskById);
router.delete('/deleteById/:id', deleteReassignTaskById);


export default router;