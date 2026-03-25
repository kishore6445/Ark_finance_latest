'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ArrowRight } from 'lucide-react';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BankTransferModal({ isOpen, onClose }: BankTransferModalProps) {
  const { state, createInterAccountTransfer } = useAppState();
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
  });

  const handleSubmit = () => {
    if (formData.fromAccountId && formData.toAccountId && formData.amount) {
      createInterAccountTransfer({
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: parseInt(formData.amount),
        date: new Date().toISOString().split('T')[0],
        description: formData.description,
        status: 'Pending',
        referenceNo: `TXN-${Date.now()}`,
      });
      setFormData({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        description: '',
      });
      onClose();
    }
  };

  const fromAccount = formData.fromAccountId ? state.bankAccounts.find((a) => a.id === formData.fromAccountId) : null;
  const toAccount = formData.toAccountId ? state.bankAccounts.find((a) => a.id === formData.toAccountId) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Transfer Between Accounts</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* From Account */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">From Account</label>
            <select
              value={formData.fromAccountId}
              onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            >
              <option value="">Select account</option>
              {state.bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountName} - Balance: ₹{account.balance.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
            {fromAccount && (
              <p className="text-xs text-muted-foreground mt-1">Bank: {fromAccount.bankName} • IFSC: {fromAccount.ifscCode}</p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-muted rounded-full">
              <ArrowRight size={20} className="text-muted-foreground" />
            </div>
          </div>

          {/* To Account */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">To Account</label>
            <select
              value={formData.toAccountId}
              onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            >
              <option value="">Select account</option>
              {state.bankAccounts
                .filter((a) => a.id !== formData.fromAccountId)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountName} - Balance: ₹{account.balance.toLocaleString('en-IN')}
                  </option>
                ))}
            </select>
            {toAccount && (
              <p className="text-xs text-muted-foreground mt-1">Bank: {toAccount.bankName} • IFSC: {toAccount.ifscCode}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Amount</label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-muted text-muted-foreground rounded-l-lg text-sm font-medium">₹</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                className="flex-1 px-3 py-2 bg-background border border-border border-l-0 rounded-r-lg text-sm"
              />
            </div>
            {fromAccount && formData.amount && (
              <p className={`text-xs mt-1.5 ${parseInt(formData.amount) > fromAccount.balance ? 'text-red-600' : 'text-green-600'}`}>
                {parseInt(formData.amount) > fromAccount.balance
                  ? `Insufficient balance. Available: ₹${fromAccount.balance.toLocaleString('en-IN')}`
                  : `Available balance: ₹${fromAccount.balance.toLocaleString('en-IN')}`}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., GST payment sweep, Tax reserve transfer"
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
            />
          </div>

          {/* Transfer Summary */}
          {fromAccount && toAccount && formData.amount && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm">
                Transfer <span className="font-semibold">₹{parseInt(formData.amount).toLocaleString('en-IN')}</span> from{' '}
                <span className="font-semibold">{fromAccount.accountName}</span> to{' '}
                <span className="font-semibold">{toAccount.accountName}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                New balance: {fromAccount.accountName} will have ₹{(fromAccount.balance - parseInt(formData.amount)).toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-border pt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
          >
            Cancel
          </button>
          <Button
            onClick={handleSubmit}
            disabled={
              !formData.fromAccountId ||
              !formData.toAccountId ||
              !formData.amount ||
              parseInt(formData.amount) > (fromAccount?.balance || 0)
            }
            className="flex-1"
          >
            Transfer
          </Button>
        </div>
      </Card>
    </div>
  );
}
