'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InvoiceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
}

export function InvoiceVerificationModal({ isOpen, onClose, invoiceId }: InvoiceVerificationModalProps) {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'mismatch'>('pending');

  const mockData = {
    po: { id: 'PO-2024-001', amount: 75000, items: 3, date: '2024-03-10' },
    invoice: { id: 'INV-2024-456', amount: 75000, items: 3, date: '2024-03-15' },
    gr: { id: 'GR-2024-789', amount: 75000, items: 3, date: '2024-03-12' }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Invoice Verification - PO-Invoice-GR Match</DialogTitle>
          <DialogDescription>Verify that Purchase Order, Invoice, and Goods Receipt match</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          {/* PO Column */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Purchase Order</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">PO ID:</span> {mockData.po.id}</div>
              <div><span className="text-gray-600">Amount:</span> ₹{mockData.po.amount.toLocaleString()}</div>
              <div><span className="text-gray-600">Items:</span> {mockData.po.items}</div>
              <div><span className="text-gray-600">Date:</span> {mockData.po.date}</div>
            </div>
          </Card>

          {/* Invoice Column */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Invoice</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Invoice ID:</span> {mockData.invoice.id}</div>
              <div><span className="text-gray-600">Amount:</span> ₹{mockData.invoice.amount.toLocaleString()}</div>
              <div><span className="text-gray-600">Items:</span> {mockData.invoice.items}</div>
              <div><span className="text-gray-600">Date:</span> {mockData.invoice.date}</div>
            </div>
          </Card>

          {/* GR Column */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Goods Receipt</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">GR ID:</span> {mockData.gr.id}</div>
              <div><span className="text-gray-600">Amount:</span> ₹{mockData.gr.amount.toLocaleString()}</div>
              <div><span className="text-gray-600">Items:</span> {mockData.gr.items}</div>
              <div><span className="text-gray-600">Date:</span> {mockData.gr.date}</div>
            </div>
          </Card>
        </div>

        {/* Verification Results */}
        <Card className="p-4 bg-blue-50">
          <div className="flex items-start gap-3">
            {verificationStatus === 'verified' ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : verificationStatus === 'mismatch' ? (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-semibold mb-2">
                {verificationStatus === 'verified' && 'Verification Successful'}
                {verificationStatus === 'mismatch' && 'Verification Mismatch'}
                {verificationStatus === 'pending' && 'Verification Status'}
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Amount Match:</span>
                  <Badge variant={mockData.po.amount === mockData.invoice.amount ? 'default' : 'destructive'}>
                    {mockData.po.amount === mockData.invoice.amount ? 'Matched' : 'Mismatch'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Items Match:</span>
                  <Badge variant={mockData.po.items === mockData.invoice.items ? 'default' : 'destructive'}>
                    {mockData.po.items === mockData.invoice.items ? 'Matched' : 'Mismatch'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>GR Match:</span>
                  <Badge variant={mockData.gr.amount === mockData.invoice.amount ? 'default' : 'destructive'}>
                    {mockData.gr.amount === mockData.invoice.amount ? 'Matched' : 'Mismatch'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { setVerificationStatus('verified'); setTimeout(onClose, 500); }}>Approve Payment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
