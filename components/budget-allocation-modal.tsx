'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BudgetAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BudgetAllocationModal({ isOpen, onClose }: BudgetAllocationModalProps) {
  const [totalBank, setTotalBank] = useState(500000);
  const [allocations, setAllocations] = useState([
    { department: 'Salaries & HR', amount: 300000, percentage: 60 },
    { department: 'Operations', amount: 150000, percentage: 30 },
    { department: 'Marketing', amount: 50000, percentage: 10 }
  ]);

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remaining = totalBank - totalAllocated;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bank Account Budget Allocation</DialogTitle>
          <DialogDescription>Allocate bank balance to departments and cost centers</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Total Bank Balance</div>
            <div className="text-3xl font-bold">₹{totalBank.toLocaleString()}</div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Department Allocations</h4>
            {allocations.map((alloc, idx) => (
              <div key={idx} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label className="text-xs">{alloc.department}</Label>
                  <Input type="number" defaultValue={alloc.amount} />
                </div>
                <div className="w-20">
                  <Label className="text-xs">%</Label>
                  <Input type="number" defaultValue={alloc.percentage} />
                </div>
              </div>
            ))}
          </div>

          <Alert className={remaining < 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <AlertCircle className={`h-4 w-4 ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`} />
            <AlertDescription className={remaining < 0 ? 'text-red-700' : 'text-green-700'}>
              {remaining >= 0 ? `Available for new allocations: ₹${remaining.toLocaleString()}` : `Over-allocated by ₹${Math.abs(remaining).toLocaleString()}`}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600">Total Allocated</div>
              <div className="font-semibold">₹{totalAllocated.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600">Remaining</div>
              <div className="font-semibold">₹{remaining.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600">Utilization</div>
              <div className="font-semibold">{((totalAllocated / totalBank) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Allocation</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
