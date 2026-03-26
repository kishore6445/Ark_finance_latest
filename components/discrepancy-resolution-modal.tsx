'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DiscrepancyResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiscrepancyResolutionModal({ isOpen, onClose }: DiscrepancyResolutionModalProps) {
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<string | null>(null);

  const discrepancies = [
    { id: '1', type: 'Unmatched Bank Item', description: 'Interest credited ₹500', date: '2024-03-20', amount: 500 },
    { id: '2', type: 'Outstanding Cheque', description: 'Cheque #1234 not yet cleared', date: '2024-03-15', amount: 25000 },
    { id: '3', type: 'Bank Charges', description: 'Monthly service charge ₹200', date: '2024-03-21', amount: 200 },
    { id: '4', type: 'Unmatched System Item', description: 'Transfer to vendor pending', date: '2024-03-19', amount: 15000 }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reconciliation Discrepancy Resolution</DialogTitle>
          <DialogDescription>Identify and resolve unmatched items</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {discrepancies.map((item) => (
            <Card
              key={item.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedDiscrepancy === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedDiscrepancy(item.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">{item.type}</span>
                    <span className="text-sm text-gray-600">({item.date})</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{item.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{item.amount.toLocaleString()}</div>
                </div>
              </div>

              {selectedDiscrepancy === item.id && (
                <Card className="mt-4 p-3 bg-gray-50">
                  <Label className="text-sm font-semibold mb-2 block">Resolution Action</Label>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline" size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Create Journal Entry
                    </Button>
                    <Button className="w-full justify-start" variant="outline" size="sm">
                      Mark as Outstanding
                    </Button>
                    <Button className="w-full justify-start" variant="outline" size="sm">
                      Match to Transaction
                    </Button>
                  </div>
                </Card>
              )}
            </Card>
          ))}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onClose}>Save & Complete Reconciliation</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
