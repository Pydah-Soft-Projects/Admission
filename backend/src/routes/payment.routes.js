import express from 'express';
import {
  getCashfreeConfig,
  getCourseFees,
  getPaymentSettings,
  updateCashfreeConfig,
  upsertBranchFees,
  deleteFeeConfig,
} from '../controllers/paymentConfig.controller.js';
import {
  createCashfreeOrder,
  getOverallConcessions,
  listFeeManagementTransactions,
  listTransactions,
  recordFeeManagementTransaction,
  recordCashPayment,
  reconcilePendingTransactions,
  verifyCashfreePayment,
  createRazorpayQR,
  verifyRazorpayQR,
  getFeeManagementGlobalAccounts,
} from '../controllers/payment.controller.js';
import { protect, requireModule } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

// payment settings - requires payments module access
router.get('/settings', requireModule('payments'), getPaymentSettings);
router.get('/settings/courses/:courseId/fees', requireModule('payments'), getCourseFees);
router.put('/settings/courses/:courseId/fees', requireModule('payments', 'write'), upsertBranchFees);
router.delete('/settings/courses/:courseId/fees/:configId', requireModule('payments', 'write'), deleteFeeConfig);

router.get('/settings/cashfree', requireModule('payments'), getCashfreeConfig);
router.put('/settings/cashfree', requireModule('payments', 'write'), updateCashfreeConfig);

// payment transactions
router.get('/transactions', listTransactions);
router.get('/overall-concessions', getOverallConcessions);
router.get('/fee-management/transactions', listFeeManagementTransactions);
router.post('/fee-management/transactions', recordFeeManagementTransaction);
router.get('/fee-management/global-accounts', getFeeManagementGlobalAccounts);
router.post('/cash', recordCashPayment);
router.post('/cashfree/order', createCashfreeOrder);
router.post('/cashfree/verify', verifyCashfreePayment);
router.post('/cashfree/reconcile', requireModule('payments', 'write'), reconcilePendingTransactions);
router.post('/razorpay/qr', createRazorpayQR);
router.post('/razorpay/verify-qr', verifyRazorpayQR);

export default router;



