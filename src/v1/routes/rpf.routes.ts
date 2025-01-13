import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addRpf, deleteRpfById, getAllRpf, getRpfById, updateRpfById } from '../controllers/rpf.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addRpf);
router.get('/', getAllRpf);
router.get('/getById/:id', getRpfById);
router.patch('/updateById/:id', updateRpfById);
router.delete('/deleteById/:id', deleteRpfById);
// router.post("/BulkUploadContacts", upload.single('file'), BulkUploadRpf);
// router.get('/getExel', downloadExcelRpf);


export default router;