import { getLogs } from '@controllersv1/log.controller';
import express from 'express';

const router = express.Router();

router.get('/get/all', getLogs);

export default router;