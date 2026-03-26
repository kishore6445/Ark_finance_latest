'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PayrollTaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  grossSalary?: number;
}

export function PayrollTaxModal({ isOpen, onClose, grossSalary = 50000 }: PayrollTaxModalProps) {
  const [salaryBreakdown] = useState({
    gross: grossSalary,
    standardDeduction: Math.min(50000, grossSalary),
    taxableIncome: Math.max(0, grossSalary - 50000),
    slabs: [
      { range: 'Up to ₹2.5L', rate: 0, tax: 0 },
      { range: '₹2.5L - ₹5L', rate: 5, tax: 0 },
      { range: '₹5L - ₹10L', rate: 20, tax: 0 },
      { range: 'Above ₹10L', rate: 30, tax: 0 }
    ],
    calculatedTax: 0,
    cessOnTax: 0,
    totalTax: 0,
    netSalary: 0
  });

  const netSalary = grossSalary - (salaryBreakdown.totalTax || 0);

  const deductions = [
    { name: 'Professional Tax', amount: 200 },
    { name: 'EPF Contribution (12%)', amount: grossSalary * 0.12 },
    { name: 'Income Tax', amount: salaryBreakdown.totalTax || 0 }
  ];

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payroll Tax Calculation</DialogTitle>
          <DialogDescription>Progressive tax calculation for employee salary</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Salary Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-green-50">
              <div className="text-sm text-gray-600 mb-1">Gross Salary</div>
              <div className="text-2xl font-bold text-green-700">₹{salaryBreakdown.gross.toLocaleString()}</div>
            </Card>
            <Card className="p-4 bg-yellow-50">
              <div className="text-sm text-gray-600 mb-1">Total Deductions</div>
              <div className="text-2xl font-bold text-yellow-700">₹{totalDeductions.toLocaleString()}</div>
            </Card>
            <Card className="p-4 bg-blue-50">
              <div className="text-sm text-gray-600 mb-1">Net Salary</div>
              <div className="text-2xl font-bold text-blue-700">₹{netSalary.toLocaleString()}</div>
            </Card>
          </div>

          {/* Tax Slabs */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Income Tax Calculation (FY 2024-25)</h4>
            <div className="space-y-2">
              <div className="text-sm flex justify-between pb-2 border-b">
                <span>Gross Salary</span>
                <span>₹{salaryBreakdown.gross.toLocaleString()}</span>
              </div>
              <div className="text-sm flex justify-between pb-2 border-b">
                <span>Less: Standard Deduction</span>
                <span>₹{salaryBreakdown.standardDeduction.toLocaleString()}</span>
              </div>
              <div className="text-sm flex justify-between pb-2 font-semibold bg-gray-50 p-2">
                <span>Taxable Income</span>
                <span>₹{salaryBreakdown.taxableIncome.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-sm font-semibold mb-2">Tax Slabs Applied</div>
              {salaryBreakdown.slabs.map((slab, idx) => (
                <div key={idx} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{slab.range} @ {slab.rate}%</span>
                  <span>₹{slab.tax.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 border-t pt-3">
              <div className="text-sm flex justify-between">
                <span>Calculated Tax</span>
                <span>₹{salaryBreakdown.calculatedTax.toLocaleString()}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Cess on Tax (4%)</span>
                <span>₹{salaryBreakdown.cessOnTax.toLocaleString()}</span>
              </div>
              <div className="text-sm flex justify-between font-semibold bg-blue-50 p-2">
                <span>Total Income Tax</span>
                <span>₹{salaryBreakdown.totalTax.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Salary Deductions</h4>
            <div className="space-y-2">
              {deductions.map((deduction, idx) => (
                <div key={idx} className="flex justify-between text-sm p-2 border-b last:border-b-0">
                  <span className="text-gray-700">{deduction.name}</span>
                  <span className="font-semibold">₹{deduction.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold p-2 bg-gray-50 mt-2">
                <span>Total Deductions</span>
                <span>₹{totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Final Amount */}
          <Card className="p-4 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Net Salary to Employee</div>
                <div className="text-3xl font-bold text-green-700">₹{netSalary.toLocaleString()}</div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onClose}>Approve This Calculation</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
