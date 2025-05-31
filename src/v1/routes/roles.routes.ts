import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addroles, deleterolesById, getrolesById, updaterolesById, getAllroles, getrolesByRole, getRolesHierarchy, downloadRoleTemplate} from '../controllers/roles.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addroles);
router.get('/', getAllroles);
router.get('/getById/:id', getrolesById);
router.get('/getByRole/:role', getrolesByRole);
router.patch('/updateById/:id', updaterolesById);
router.delete('/deleteById/:id', deleterolesById);
router.get("/hierarchy", getRolesHierarchy);
router.post('/getExcel', downloadRoleTemplate);


export default router;