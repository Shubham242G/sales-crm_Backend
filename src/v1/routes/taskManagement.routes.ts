import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addTaskManagement, deleteTaskManagementById, getTaskManagementById, updateTaskManagementById, getAllTaskManagement, getMyTasks, downloadExcelTask, downloadTaskTemplate } from '../controllers/taskManagement.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', authorizeJwt, addTaskManagement);
router.get('/', getAllTaskManagement);
router.get('/my-task', authorizeJwt, getMyTasks);
router.get('/getById/:id', getTaskManagementById);
router.patch('/updateById/:id', updateTaskManagementById);
router.delete('/deleteById/:id', deleteTaskManagementById);
router.post('/getExcel', downloadTaskTemplate);



export default router;

