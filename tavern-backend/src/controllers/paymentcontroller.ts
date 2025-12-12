// tavern-backend/src/controllers/paymentController.ts
import { Request, Response } from 'express';
import paymentService from '../services/paymentService';
import { TransactionType, TransactionStatus } from '../models/Transaction';

export class PaymentController {
  /**
   * Create a new payment
   * POST /api/payments
   */
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { amount, description, questId, metadata } = req.body;
      const userId = (req as any).user.id; // From JWT middleware

      if (!amount || !description) {
        res.status(400).json({
          success: false,
          message: 'Amount and description are required'
        });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
        return;
      }

      const transaction = await paymentService.createPayment({
        userId,
        amount,
        description,
        questId,
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: transaction
      });
    } catch (error: any) {
      console.error('Create payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment',
        error: error.message
      });
    }
  }

  /**
   * Release a payment
   * POST /api/payments/:transactionId/release
   */
  async releasePayment(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const userId = (req as any).user.id;

      const transaction = await paymentService.releasePayment(transactionId, userId);

      res.status(200).json({
        success: true,
        message: 'Payment released successfully',
        data: transaction
      });
    } catch (error: any) {
      console.error('Release payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to release payment'
      });
    }
  }

  /**
   * Process a refund
   * POST /api/payments/:transactionId/refund
   */
  async processRefund(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { amount, reason } = req.body;
      const userId = (req as any).user.id;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Refund reason is required'
        });
        return;
      }

      const refund = await paymentService.processRefund({
        originalTransactionId: transactionId,
        userId,
        amount,
        reason
      });

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: refund
      });
    } catch (error: any) {
      console.error('Process refund error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process refund'
      });
    }
  }

  /**
   * Get user's transaction ledger
   * GET /api/payments/ledger
   */
  async getLedger(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const {
        type,
        status,
        startDate,
        endDate,
        limit,
        skip
      } = req.query;

      const filters: any = {};
      if (type) filters.type = type as TransactionType;
      if (status) filters.status = status as TransactionStatus;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string);
      if (skip) filters.skip = parseInt(skip as string);

      const ledger = await paymentService.getUserLedger(userId, filters);

      res.status(200).json({
        success: true,
        data: ledger
      });
    } catch (error: any) {
      console.error('Get ledger error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve ledger',
        error: error.message
      });
    }
  }

  /**
   * Get transaction by ID
   * GET /api/payments/:transactionId
   */
  async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const userId = (req as any).user.id;

      const transaction = await paymentService.getTransactionById(transactionId, userId);

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error: any) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction',
        error: error.message
      });
    }
  }

  /**
   * Get transaction summary
   * GET /api/payments/summary
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const summary = await paymentService.getTransactionSummary(userId);

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      console.error('Get summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve summary',
        error: error.message
      });
    }
  }
}

export default new PaymentController();
