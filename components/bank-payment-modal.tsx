'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BankPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceAmount?: number;
}

export function BankPaymentModal({ isOpen, onClose, invoiceAmount = 75000 }: BankPaymentModalProps) {
  const [bankBalance] = useState(500000);
  const [paymentAmount, setPaymentAmount] = useState(invoiceAmount);
  const [selectedBank, setSelectedBank] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const banks = [
    { id: 'icici', name: 'ICICI Bank', balance: 500000 },
    { id: 'hdfc', name: 'HDFC Bank', balance: 300000 },
    { id: 'axis', name: 'Axis Bank', balance: 200000 }
  ];

  const selectedBankBalance = banks.find(b => b.id === selectedBank)?.balance || 0;
  const hasSufficientBalance = paymentAmount <= selectedBankBalance;
  const balanceAfterPayment = selectedBankBalance - paymentAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bank Payment Transaction</DialogTitle>
          <DialogDescription>Record payment from bank account</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bank Account</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name} (₹{bank.balance.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
          </div>

          {selectedBank && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Current Balance</div>
                    <div className="text-2xl font-bold">₹{selectedBankBalance.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Balance After Payment</div>
                    <div className="text-2xl font-bold">₹{balanceAfterPayment.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {!hasSufficientBalance && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    Insufficient balance. Required: ₹{paymentAmount.toLocaleString()}, Available: ₹{selectedBankBalance.toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label>Payment Amount</Label>
                <Input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className={!hasSufficientBalance ? 'border-red-300' : ''}
                />
              </div>

              <div>
                <Label>Reference (Invoice/Cheque No.)</Label>
                <Input placeholder="e.g., INV-2024-456" />
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="neft">NEFT</SelectItem>
                    <SelectItem value="rtgs">RTGS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!hasSufficientBalance} onClick={onClose}>Execute Payment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
