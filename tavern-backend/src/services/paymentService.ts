// tavern-backend/src/services/paymentService.ts
import Transaction, { ITransaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { v4 as uuidv4 } from 'uuid';

export class PaymentService {
  /**
   * Create a new payment transaction
   */
  async createPayment(data: {
    userId: string;
    questId?: string;
    amount: number;
    description: string;
    metadata?: any;
  }): Promise<ITransaction> {
    const transaction = new Transaction({
      transactionId: `TXN-${uuidv4()}`,
      userId: data.userId,
      questId: data.questId,
      amount: data.amount,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.PENDING,
      description: data.description,
      metadata: data.metadata
    });

    await transaction.save();
    return transaction;
  }

  /**
   * Release payment (complete a held payment)
   */
  async releasePayment(transactionId: string, userId: string): Promise<ITransaction> {
    const transaction = await Transaction.findOne({
      transactionId,
      userId,
      type: TransactionType.PAYMENT,
      status: { $in: [TransactionStatus.PENDING, TransactionStatus.ON_HOLD] }
    });

    if (!transaction) {
      throw new Error('Transaction not found or cannot be released');
    }

    transaction.status = TransactionStatus.COMPLETED;
    transaction.completedAt = new Date();
    await transaction.save();

    // Create release record
    const releaseRecord = new Transaction({
      transactionId: `REL-${uuidv4()}`,
      userId: transaction.userId,
      questId: transaction.questId,
      amount: transaction.amount,
      type: TransactionType.RELEASE,
      status: TransactionStatus.COMPLETED,
      description: `Payment released for: ${transaction.description}`,
      metadata: {
        ...transaction.metadata,
        originalTransactionId: transaction.transactionId
      },
      completedAt: new Date()
    });

    await releaseRecord.save();
    return transaction;
  }

  /**
   * Process refund
   */
  async processRefund(data: {
    originalTransactionId: string;
    userId: string;
    amount?: number; // Partial refund support
    reason: string;
  }): Promise<ITransaction> {
    const originalTransaction = await Transaction.findOne({
      transactionId: data.originalTransactionId,
      userId: data.userId,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED
    });

    if (!originalTransaction) {
      throw new Error('Original transaction not found or cannot be refunded');
    }

    const refundAmount = data.amount || originalTransaction.amount;

    if (refundAmount > originalTransaction.amount) {
      throw new Error('Refund amount cannot exceed original payment amount');
    }

    const refundTransaction = new Transaction({
      transactionId: `RFD-${uuidv4()}`,
      userId: data.userId,
      questId: originalTransaction.questId,
      amount: refundAmount,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      description: `Refund for: ${originalTransaction.description}`,
      metadata: {
        ...originalTransaction.metadata,
        refundReason: data.reason,
        originalTransactionId: data.originalTransactionId
      },
      completedAt: new Date()
    });

    await refundTransaction.save();
    return refundTransaction;
  }

  /**
   * Get user's transaction ledger
   */
  async getUserLedger(
    userId: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ transactions: ITransaction[]; total: number; balance: number }> {
    const query: any = { userId };

    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const limit = filters?.limit || 50;
    const skip = filters?.skip || 0;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    // Calculate balance
    const balanceAggregation = await Transaction.aggregate([
      { $match: { userId, status: TransactionStatus.COMPLETED } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let balance = 0;
    balanceAggregation.forEach(item => {
      if (item._id === TransactionType.PAYMENT) {
        balance -= item.total;
      } else if (item._id === TransactionType.REFUND) {
        balance += item.total;
      }
    });

    return {
      transactions: transactions as ITransaction[],
      total,
      balance
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string, userId: string): Promise<ITransaction | null> {
    return Transaction.findOne({ transactionId, userId });
  }

  /**
   * Get transaction summary/statistics
   */
  async getTransactionSummary(userId: string): Promise<{
    totalPayments: number;
    totalRefunds: number;
    pendingAmount: number;
    completedAmount: number;
  }> {
    const summary = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            type: '$type',
            status: '$status'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalPayments: 0,
      totalRefunds: 0,
      pendingAmount: 0,
      completedAmount: 0
    };

    summary.forEach(item => {
      if (item._id.type === TransactionType.PAYMENT) {
        if (item._id.status === TransactionStatus.COMPLETED) {
          result.completedAmount += item.total;
        } else if (item._id.status === TransactionStatus.PENDING) {
          result.pendingAmount += item.total;
        }
        result.totalPayments += item.total;
      } else if (item._id.type === TransactionType.REFUND) {
        result.totalRefunds += item.total;
      }
    });

    return result;
  }
}

export default new PaymentService();
