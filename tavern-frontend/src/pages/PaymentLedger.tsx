import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, ArrowDownCircle, Filter, X } from 'lucide-react';

// Types
enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  RELEASE = 'RELEASE'
}

enum TransactionStatus {
  PENDING = 'PENDING',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

interface Transaction {
  transactionId: string;
  userId: string;
  questId?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  createdAt: string;
  completedAt?: string;
  metadata?: any;
}

interface LedgerResponse {
  transactions: Transaction[];
  total: number;
  balance: number;
}

interface TransactionSummary {
  totalPayments: number;
  totalRefunds: number;
  pendingAmount: number;
  completedAmount: number;
}

const PaymentLedger: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalPayments: 0,
    totalRefunds: 0,
    pendingAmount: 0,
    completedAmount: 0
  });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | ''>('');

  // Mock user ID - replace with actual auth
  const userId = 'user123';

  // Fetch ledger data
  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/payments/ledger?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data: LedgerResponse = await response.json();
        setTransactions(data.transactions);
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/payments/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data: TransactionSummary = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  // Release payment
  const handleRelease = async () => {
    if (!selectedTransaction) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/payments/${selectedTransaction.transactionId}/release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowReleaseModal(false);
        fetchLedger();
        fetchSummary();
        alert('Payment released successfully!');
      }
    } catch (error) {
      console.error('Failed to release payment:', error);
      alert('Failed to release payment');
    } finally {
      setLoading(false);
    }
  };

  // Process refund
  const handleRefund = async () => {
    if (!selectedTransaction || !refundReason) return;

    setLoading(true);
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalTransactionId: selectedTransaction.transactionId,
          amount: refundAmount ? parseFloat(refundAmount) : undefined,
          reason: refundReason
        })
      });

      if (response.ok) {
        setShowRefundModal(false);
        setRefundReason('');
        setRefundAmount('');
        fetchLedger();
        fetchSummary();
        alert('Refund processed successfully!');
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
      alert('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    fetchSummary();
  }, [filterType, filterStatus]);

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TransactionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TransactionStatus.ON_HOLD:
        return 'bg-orange-100 text-orange-800';
      case TransactionStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.PAYMENT:
        return 'text-red-600';
      case TransactionType.REFUND:
        return 'text-green-600';
      case TransactionType.RELEASE:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payment Ledger</h1>
          <p className="text-gray-600 mt-1">Manage your transactions, releases, and refunds</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-2xl font-bold text-gray-900">${balance.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-red-600">${summary.totalPayments.toFixed(2)}</p>
              </div>
              <ArrowDownCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Refunds</p>
                <p className="text-2xl font-bold text-green-600">${summary.totalRefunds.toFixed(2)}</p>
              </div>
              <RefreshCw className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">${summary.pendingAmount.toFixed(2)}</p>
              </div>
              <Filter className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TransactionType | '')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Types</option>
                <option value={TransactionType.PAYMENT}>Payment</option>
                <option value={TransactionType.REFUND}>Refund</option>
                <option value={TransactionType.RELEASE}>Release</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TransactionStatus | '')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value={TransactionStatus.PENDING}>Pending</option>
                <option value={TransactionStatus.ON_HOLD}>On Hold</option>
                <option value={TransactionStatus.COMPLETED}>Completed</option>
                <option value={TransactionStatus.FAILED}>Failed</option>
              </select>
            </div>

            <button
              onClick={() => {
                setFilterType('');
                setFilterStatus('');
              }}
              className="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.transactionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.transactionId}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{transaction.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {transaction.type === TransactionType.PAYMENT &&
                            (transaction.status === TransactionStatus.PENDING ||
                              transaction.status === TransactionStatus.ON_HOLD) && (
                              <button
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowReleaseModal(true);
                                }}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                              >
                                Release
                              </button>
                            )}
                          {transaction.type === TransactionType.PAYMENT &&
                            transaction.status === TransactionStatus.COMPLETED && (
                              <button
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowRefundModal(true);
                                }}
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                              >
                                Refund
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Release Modal */}
        {showReleaseModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Release Payment</h3>
                <button onClick={() => setShowReleaseModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">Transaction ID: {selectedTransaction.transactionId}</p>
                <p className="text-gray-600 mb-2">Amount: ${selectedTransaction.amount.toFixed(2)}</p>
                <p className="text-gray-600">Description: {selectedTransaction.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRelease}
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Release'}
                </button>
                <button
                  onClick={() => setShowReleaseModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Process Refund</h3>
                <button onClick={() => setShowRefundModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">Transaction ID: {selectedTransaction.transactionId}</p>
                <p className="text-gray-600 mb-4">Original Amount: ${selectedTransaction.amount.toFixed(2)}</p>
                
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount (optional, leave blank for full refund)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={selectedTransaction.amount.toFixed(2)}
                  max={selectedTransaction.amount}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Refund *
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter refund reason..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefund}
                  disabled={loading || !refundReason}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Refund'}
                </button>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentLedger;
