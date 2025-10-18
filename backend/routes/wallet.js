import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getBalance,
  getTransactions,
  fundWallet
} from '../controllers/walletController.js';

const router = express.Router();

router.use(protect);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.post('/fund', fundWallet);

export default router;
