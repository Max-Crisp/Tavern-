// tavern-frontend/src/components/PaymentLedger.tsx
import React, { useState, useEffect } from 'react';
import { paymentApi } from '../api/paymentApi';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionSummary
} from '../types/payment';

export const PaymentLedger: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Refund modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | undefined>();

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ledgerData, summaryData] = await Promise.all([
        paymentApi.getLedger({
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          limit,
          skip: page * limit
        }),
        paymentApi.getSummary()
      ]);

      setTransactions(ledgerData.transactions);
      setTotal(ledgerData.total);
      setBalance(ledgerData.balance);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transactions');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async (transactionId: string) => {
    if (!confirm('Are you sure you want to release this payment?')) return;

    try {
      await paymentApi.releasePayment(transactionId);
      alert('Payment released successfully!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to release payment');
    }
  };

  const handleRefund = async () => {
    if (!selectedTransaction || !refundReason.trim()) {
      alert('Please provide a refund reason');
      return;
    }

    try {
      await paymentApi.processRefund(selectedTransaction.transactionId, {
        amount: refundAmount,
        reason: refundReason
      });
      alert('Refund processed successfully!');
      setRefundModalOpen(false);
      setRefundReason('');
      setRefundAmount(undefined);
      setSelectedTransaction(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process refund');
    }
  };

  const openRefundModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRefundAmount(transaction.amount);
    setRefundModalOpen(true);
  };

  const getStatusColor = (status: TransactionStatus): string => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'text-green-600 bg-green-100';
      case TransactionStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case TransactionStatus.FAILED:
        return 'text-red-600 bg-red-100';
      case TransactionStatus.ON_HOLD:
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: TransactionType): string => {
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

  const formatAmount = (amount: number, type: TransactionType): string => {
    const sign = type === TransactionType.PAYMENT ? '-' : '+';
    return `${sign}$${amount.toFixed(2)}`;
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Payment Ledger</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Payments</p>
            <p className="text-2xl font-bold text-red-600">
              ${summary.totalPayments.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Refunds</p>
            <p className="text-2xl font-bold text-green-600">
              ${summary.totalRefunds.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              ${summary.pendingAmount.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Balance</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value={TransactionType.PAYMENT}>Payment</option>
              <option value={TransactionType.REFUND}>Refund</option>
              <option value={TransactionType.RELEASE}>Release</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value={TransactionStatus.COMPLETED}>Completed</option>
              <option value={TransactionStatus.PENDING}>Pending</option>
              <option value={TransactionStatus.ON_HOLD}>On Hold</option>
              <option value={TransactionStatus.FAILED}>Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {transaction.transactionId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getTypeColor(transaction.type)}`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {transaction.type === TransactionType.PAYMENT &&
                        (transaction.status === TransactionStatus.PENDING ||
                          transaction.status === TransactionStatus.ON_HOLD) && (
                          <button
                            onClick={() => handleReleasePayment(transaction.transactionId)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Release
                          </button>
                        )}
                      {transaction.type === TransactionType.PAYMENT &&
                        transaction.status === TransactionStatus.COMPLETED && (
                          <button
                            onClick={() => openRefundModal(transaction)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Refund
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{page * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min((page + 1) * limit, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * limit >= total}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {refundModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Process Refund
              </h3>
              <div className="mt-2 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Transaction ID:</p>
                  <p className="font-mono text-sm">{selectedTransaction.transactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Original Amount:</p>
                  <p className="font-bold">${selectedTransaction.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount (optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedTransaction.amount}
                    value={refundAmount || ''}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full refund if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Please provide a reason for the refund..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setRefundModalOpen(false);
                    setRefundReason('');
                    setRefundAmount(undefined);
                    setSelectedTransaction(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentLedger;
