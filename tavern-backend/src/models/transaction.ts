import mongoose, { Schema, Document } from 'mongoose';

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

export interface ITransaction extends Document {
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
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    questId: {
      type: String,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      required: true,
      default: TransactionStatus.PENDING
    },
    description: {
      type: String,
      required: true
    },
    metadata: {
      questName: String,
      guildName: String,
      completionDate: Date,
      refundReason: String,
      originalTransactionId: String
    },
    completedAt: Date
  },
  {
    timestamps: true
  }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, type: 1 });
TransactionSchema.index({ transactionId: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
