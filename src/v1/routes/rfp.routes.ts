import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addRfp,  deleteRfpById, getAllRfp, getRfpById, updateRfpById, convertRfp, downloadRfpTemplate } from '../controllers/rfp.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();
router.post('/', addRfp);
router.get('/', getAllRfp);
router.get('/getById/:id', getRfpById);
router.patch('/updateById/:id', updateRfpById);
router.delete('/deleteById/:id', deleteRfpById);
// router.post("/BulkUploadContacts", upload.single('file'), BulkUploadRfp);
router.post('/getExcel', downloadRfpTemplate);

router.post('/convertRfp/:id', convertRfp);

export default router;