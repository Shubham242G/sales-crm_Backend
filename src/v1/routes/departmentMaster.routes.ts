import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addDepartmentMaster, deleteDepartmentMasterById, getDepartmentMasterById, updateDepartmentMasterById, getAllDepartmentMaster } from '../controllers/departmentMaster.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addDepartmentMaster);
router.get('/', getAllDepartmentMaster);
router.get('/getById/:id', getDepartmentMasterById);
router.get('/getAllDepartmentMaster', getAllDepartmentMaster);
router.patch('/updateById/:id', updateDepartmentMasterById);
router.delete('/deleteById/:id', deleteDepartmentMasterById);
router.post('/getExcel', )


export default router;