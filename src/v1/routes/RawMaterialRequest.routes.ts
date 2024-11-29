import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { approveRawMaterialRequest, denyRawMaterialRequest, getRawMaterialRequest, requestRawMaterial, getById } from '@controllersv1/RawMaterialRequest.controller';
const router = express.Router();


router.post('/', authorizeJwt, requestRawMaterial);
router.get('/', authorizeJwt, getRawMaterialRequest);
router.get('/getById/:id', authorizeJwt, getById);
router.patch('/approve/:id', authorizeJwt, approveRawMaterialRequest);
router.patch('/deny/:id', authorizeJwt, denyRawMaterialRequest);



export default router;