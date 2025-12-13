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

// tavern-frontend/src/api/paymentApi.ts
import axios from 'axios';
import { Transaction, TransactionSummary, LedgerResponse } from '../types/payment';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const paymentApi = {
  // Create a new payment
  createPayment: async (data: {
    amount: number;
    description: string;
    questId?: string;
    metadata?: any;
  }): Promise<Transaction> => {
    const response = await axios.post(
      `${API_URL}/payments`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  },

  // Release a payment
  releasePayment: async (transactionId: string): Promise<Transaction> => {
    const response = await axios.post(
      `${API_URL}/payments/${transactionId}/release`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data.data;
  },

  // Process refund
  processRefund: async (
    transactionId: string,
    data: { amount?: number; reason: string }
  ): Promise<Transaction> => {
    const response = await axios.post(
      `${API_URL}/payments/${transactionId}/refund`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  },

  // Get ledger
  getLedger: async (filters?: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    skip?: number;
  }): Promise<LedgerResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    const response = await axios.get(
      `${API_URL}/payments/ledger?${params.toString()}`,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  },

  // Get single transaction
  getTransaction: async (transactionId: string): Promise<Transaction> => {
    const response = await axios.get(
      `${API_URL}/payments/${transactionId}`,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  },

  // Get summary
  getSummary: async (): Promise<TransactionSummary> => {
    const response = await axios.get(
      `${API_URL}/payments/summary`,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  }
};
