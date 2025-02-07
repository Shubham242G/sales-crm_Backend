import express from 'express';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { addroles, deleterolesById, getrolesById, updaterolesById, getAllroles} from '../controllers/roles.controller';
import { upload } from '@middlewares/multer.middleware';
const router = express.Router();


router.post('/', addroles);
router.get('/', getAllroles);
router.get('/getById/:id', getrolesById);
router.patch('/updateById/:id', updaterolesById);
router.delete('/deleteById/:id', deleterolesById);


export default router;