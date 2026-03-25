'use client';

import { useState } from 'react';
import { FileText, Download, Filter, Eye, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PayrollRegisterEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  payrollMonth: string;
  basic: number;
  da: number;
  hra: number;
  conveyance: number;
  medical: number;
  grossSalary: number;
  pf: number;
  esi: number;
  incomeTax: number;
  pt: number;
  totalDeductions: number;
  netSalary: number;
  bankAccount: string;
  transferStatus: 'Pending' | 'Processed' | 'Cancelled';
  transferDate?: string;
}

export function PayrollRegisterScreen() {
  const [payrollRegister, setPayrollRegister] = useState<PayrollRegisterEntry[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'Rajesh Kumar',
      designation: 'Senior Developer',
      payrollMonth: '2024-03',
      basic: 50000,
      da: 10000,
      hra: 15000,
      conveyance: 2000,
      medical: 1000,
      grossSalary: 78000,
      pf: 7200,
      esi: 1236,
      incomeTax: 4500,
      pt: 200,
      totalDeductions: 13136,
      netSalary: 64864,
      bankAccount: '****1234',
      transferStatus: 'Processed',
      transferDate: '2024-03-25',
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Priya Sharma',
      designation: 'Product Manager',
      payrollMonth: '2024-03',
      basic: 60000,
      da: 12000,
      hra: 18000,
      conveyance: 2500,
      medical: 1500,
      grossSalary: 94000,
      pf: 8640,
      esi: 1500,
      incomeTax: 6500,
      pt: 250,
      totalDeductions: 16890,
      netSalary: 77110,
      bankAccount: '****5678',
      transferStatus: 'Processed',
      transferDate: '2024-03-25',
    },
  ]);

  const [selectedMonth, setSelectedMonth] = useState('2024-03');
  const [selectedEntry, setSelectedEntry] = useState<PayrollRegisterEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Processed' | 'Cancelled'>('All');

  const filteredRegister = payrollRegister.filter(entry => {
    if (entry.payrollMonth !== selectedMonth) return false;
    if (filterStatus === 'All') return true;
    return entry.transferStatus === filterStatus;
  });

  const totals = {
    employees: filteredRegister.length,
    grossTotal: filteredRegister.reduce((sum, e) => sum + e.grossSalary, 0),
    deductionsTotal: filteredRegister.reduce((sum, e) => sum + e.totalDeductions, 0),
    netTotal: filteredRegister.reduce((sum, e) => sum + e.netSalary, 0),
  };

  const handleDownload = () => {
    // CSV download logic
    const csvContent = [
      ['Employee ID', 'Employee Name', 'Designation', 'Basic', 'DA', 'HRA', 'Gross', 'PF', 'ESI', 'IT', 'PT', 'Deductions', 'Net', 'Status'].join(','),
      ...filteredRegister.map(e => [e.employeeId, e.employeeName, e.designation, e.basic, e.da, e.hra, e.grossSalary, e.pf, e.esi, e.incomeTax, e.pt, e.totalDeductions, e.netSalary, e.transferStatus].join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-register-${selectedMonth}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Register</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed payroll transaction summary by employee</p>
        </div>
        <Button onClick={handleDownload} className="gap-2">
          <Download size={18} />
          Download CSV
        </Button>
      </div>

      {/* Month Selection and Filters */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="text-sm font-medium">Payroll Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="mt-1 px-3 py-2 border border-border rounded-lg w-48"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Transfer Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="mt-1 px-3 py-2 border border-border rounded-lg w-48"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Processed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl font-bold">{totals.employees}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Gross</p>
          <p className="text-2xl font-bold text-green-600">₹{(totals.grossTotal / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Deductions</p>
          <p className="text-2xl font-bold text-red-600">₹{(totals.deductionsTotal / 10000).toFixed(1)}K</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Net</p>
          <p className="text-2xl font-bold text-blue-600">₹{(totals.netTotal / 100000).toFixed(1)}L</p>
        </div>
      </div>

      {/* Payroll Register Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-muted/40 to-muted/20 border-b">
                <th className="px-4 py-3 text-left font-semibold">Employee</th>
                <th className="px-4 py-3 text-left font-semibold">Designation</th>
                <th className="px-4 py-3 text-right font-semibold">Gross</th>
                <th className="px-4 py-3 text-right font-semibold">PF</th>
                <th className="px-4 py-3 text-right font-semibold">ESI</th>
                <th className="px-4 py-3 text-right font-semibold">IT</th>
                <th className="px-4 py-3 text-right font-semibold">Deductions</th>
                <th className="px-4 py-3 text-right font-semibold">Net</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegister.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{entry.employeeName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.designation}</td>
                  <td className="px-4 py-3 text-right font-semibold">₹{entry.grossSalary.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₹{entry.pf.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₹{entry.esi.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₹{entry.incomeTax.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">₹{entry.totalDeductions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">₹{entry.netSalary.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      entry.transferStatus === 'Processed' ? 'bg-green-100 text-green-700' :
                      entry.transferStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {entry.transferStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payroll Details - {selectedEntry.employeeName}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">EARNINGS</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between"><span>Basic Salary</span><span className="font-medium">₹{selectedEntry.basic}</span></div>
                  <div className="flex justify-between"><span>DA</span><span className="font-medium">₹{selectedEntry.da}</span></div>
                  <div className="flex justify-between"><span>HRA</span><span className="font-medium">₹{selectedEntry.hra}</span></div>
                  <div className="flex justify-between"><span>Conveyance</span><span className="font-medium">₹{selectedEntry.conveyance}</span></div>
                  <div className="flex justify-between"><span>Medical</span><span className="font-medium">₹{selectedEntry.medical}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold"><span>Gross Salary</span><span>₹{selectedEntry.grossSalary}</span></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">DEDUCTIONS</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between"><span>PF</span><span className="font-medium">₹{selectedEntry.pf}</span></div>
                  <div className="flex justify-between"><span>ESI</span><span className="font-medium">₹{selectedEntry.esi}</span></div>
                  <div className="flex justify-between"><span>Income Tax</span><span className="font-medium">₹{selectedEntry.incomeTax}</span></div>
                  <div className="flex justify-between"><span>PT</span><span className="font-medium">₹{selectedEntry.pt}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold"><span>Total Deductions</span><span>₹{selectedEntry.totalDeductions}</span></div>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 flex justify-between text-lg font-bold">
              <span>Net Salary</span>
              <span className="text-green-600">₹{selectedEntry.netSalary.toLocaleString()}</span>
            </div>
            <div className="bg-muted/50 p-3 rounded text-sm">
              <p className="text-muted-foreground">Bank Transfer: {selectedEntry.bankAccount}</p>
              <p className="text-muted-foreground">Status: {selectedEntry.transferStatus} {selectedEntry.transferDate && `on ${selectedEntry.transferDate}`}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
