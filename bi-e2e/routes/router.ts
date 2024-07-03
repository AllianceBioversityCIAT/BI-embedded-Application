import { Router } from 'express';
import biE2E from '../controllers/biFrontController';

const router = Router();

router.get('/bi-front', biE2E);

export default router;
