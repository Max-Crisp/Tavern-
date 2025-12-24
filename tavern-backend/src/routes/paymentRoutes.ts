// tavern-backend/src/routes/paymentRoutes.ts
import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private
 */
router.post('/', paymentController.createPayment.bind(paymentController));

/**
 * @route   GET /api/payments/summary
 * @desc    Get transaction summary
 * @access  Private
 */
router.get('/summary', paymentController.getSummary.bind(paymentController));

/**
 * @route   GET /api/payments/ledger
 * @desc    Get user's transaction ledger
 * @access  Private
 */
router.get('/ledger', paymentController.getLedger.bind(paymentController));

/**
 * @route   GET /api/payments/:transactionId
 * @desc    Get specific transaction
 * @access  Private
 */
router.get('/:transactionId', paymentController.getTransaction.bind(paymentController));

/**
 * @route   POST /api/payments/:transactionId/release
 * @desc    Release a held payment
 * @access  Private
 */
router.post('/:transactionId/release', paymentController.releasePayment.bind(paymentController));

/**
 * @route   POST /api/payments/:transactionId/refund
 * @desc    Process a refund
 * @access  Private
 */
router.post('/:transactionId/refund', paymentController.processRefund.bind(paymentController));

export default router;
