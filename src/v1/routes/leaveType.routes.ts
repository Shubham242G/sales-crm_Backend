import express from 'express';
import { createLeaveType, getLeaveTypes, getLeaveTypeById, updateLeaveType, deleteLeaveType } from '../controllers/leaveType.controller';

const router = express.Router();

router.post('/', createLeaveType);
router.get('/', getLeaveTypes);
router.get('/getById/:id', getLeaveTypeById);
router.put('/updateById/:id', updateLeaveType);
router.delete('/deleteById/:id', deleteLeaveType);

export default router;
