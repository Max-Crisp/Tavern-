// tavern-frontend/src/types/payment.ts
export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  RELEASE = 'RELEASE',
  HOLD = 'HOLD'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

export interface Transaction {
  _id: string;
  transactionId: string;
  userId: string;
  questId?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  metadata?: {
    questName?: string;
    guildName?: string;
    completionDate?: Date;
    refundReason?: string;
    originalTransactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TransactionSummary {
  totalPayments: number;
  totalRefunds: number;
  pendingAmount: number;
  completedAmount: number;
}

export interface LedgerResponse {
  transactions: Transaction[];
  total: number;
  balance: number;
}

