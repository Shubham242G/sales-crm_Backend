import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { getAllNotification, getNotificationById, deleteNotificationById, updateNotificationById, getNotificationByUserId, addNotification} from '../controllers/notification.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addNotification);
router.get('/', getAllNotification);
router.get('/getById/:id', getNotificationById);
router.patch('/updateById/:id', updateNotificationById);
router.delete('/deleteById/:id', deleteNotificationById);
router.get("/getByUserId/:userId", getNotificationByUserId);



export default router;