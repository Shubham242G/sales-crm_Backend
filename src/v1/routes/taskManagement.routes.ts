import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addTaskManagement, deleteTaskManagementById, getTaskManagementById, updateTaskManagementById, getAllTaskManagement} from '../controllers/taskManagement.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addTaskManagement);
router.get('/', getAllTaskManagement);
router.get('/getById/:id', getTaskManagementById);
router.patch('/updateById/:id', updateTaskManagementById);
router.delete('/deleteById/:id', deleteTaskManagementById);


export default router;