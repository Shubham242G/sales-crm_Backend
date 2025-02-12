import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addLead, deleteLeadById, getLeadById, updateLeadById, getAllLead, convertToContact, BulkUploadLead, downloadExcelLead} from '../controllers/lead.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addLead);
router.get('/', getAllLead);
router.get('/getById/:id', getLeadById);
router.patch('/updateById/:id', updateLeadById);
router.delete('/deleteById/:id', deleteLeadById);
router.post("/convert/:id", convertToContact)
router.post("/bulkUploadLeads", upload.single('file'), BulkUploadLead);
router.get('/getExel', downloadExcelLead);

export default router;