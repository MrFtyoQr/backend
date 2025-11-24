import express from 'express';
import {
  createTransaction,
  deleteTransaction,
  getTransactionsByUserId,
  getSummaryByUserId,
} from '../controllers/transactionsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/summary/:userId', getSummaryByUserId);
router.get('/summary', getSummaryByUserId);
router.get('/:userId', getTransactionsByUserId);
router.get('/', getTransactionsByUserId);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);

export default router;
