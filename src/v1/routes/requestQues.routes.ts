import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import {getAllRequestQues,getRequestQuesById,updateRequestQuesById} from '@controllersv1/requestQues.controller';
const router = express.Router();
router.get('/', authorizeJwt, getAllRequestQues);
router.get('/getById/:id', authorizeJwt, getRequestQuesById);
router.patch('/updateById/:id', authorizeJwt, updateRequestQuesById);
export default router;