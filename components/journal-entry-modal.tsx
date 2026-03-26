'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JournalEntryModal({ isOpen, onClose }: JournalEntryModalProps) {
  const [entries, setEntries] = useState([
    { account: '', debit: '', credit: '' }
  ]);

  const accounts = [
    'Bank Account',
    'Interest Expense',
    'Bank Charges',
    'Outstanding Cheques',
    'Uncleared Deposits',
    'Suspense Account'
  ];

  const addEntry = () => {
    setEntries([...entries, { account: '', debit: '', credit: '' }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Journal Entry</DialogTitle>
          <DialogDescription>Record adjustments for reconciliation discrepancies</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Entry Date</Label>
              <Input type="date" defaultValue="2024-03-21" />
            </div>
            <div>
              <Label>Reference</Label>
              <Input placeholder="e.g., Bank Recon #123" />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea placeholder="Reason for this journal entry" rows={2} />
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Entries</h4>
              <Button variant="outline" size="sm" onClick={addEntry}>Add Entry</Button>
            </div>

            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Account</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Debit</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Credit</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  {entries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(index)}
                      className="h-10"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm">
            <div className="flex justify-between">
              <span>Total Debit:</span>
              <span className="font-semibold">₹0</span>
            </div>
            <div className="flex justify-between">
              <span>Total Credit:</span>
              <span className="font-semibold">₹0</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save & Post</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
