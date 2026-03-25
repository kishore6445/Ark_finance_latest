'use client';

import { useState } from 'react';
import { FileText, Play, Download, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PayrollRun {
  id: string;
  payrollMonth: string;
  payrollDate: string;
  totalEmployees: number;
  processedEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  status: 'Draft' | 'Processing' | 'Completed' | 'Approved' | 'Paid';
  approvedBy?: string;
  approvalDate?: string;
  processedDate?: string;
  paidDate?: string;
}

export function PayrollProcessingScreen() {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([
    {
      id: '1',
      payrollMonth: '2024-03',
      payrollDate: '2024-03-31',
      totalEmployees: 15,
      processedEmployees: 15,
      totalGross: 750000,
      totalDeductions: 85000,
      totalNet: 665000,
      status: 'Paid',
      approvedBy: 'Admin',
      approvalDate: '2024-03-25',
      processedDate: '2024-03-26',
      paidDate: '2024-03-31',
    },
    {
      id: '2',
      payrollMonth: '2024-02',
      payrollDate: '2024-02-29',
      totalEmployees: 15,
      processedEmployees: 15,
      totalGross: 750000,
      totalDeductions: 85000,
      totalNet: 665000,
      status: 'Paid',
      approvedBy: 'Admin',
      approvalDate: '2024-02-24',
      processedDate: '2024-02-25',
      paidDate: '2024-02-29',
    },
  ]);

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newRun: PayrollRun = {
      id: Date.now().toString(),
      payrollMonth: selectedMonth,
      payrollDate: new Date().toISOString().split('T')[0],
      totalEmployees: 15,
      processedEmployees: 15,
      totalGross: 750000,
      totalDeductions: 85000,
      totalNet: 665000,
      status: 'Completed',
      processedDate: new Date().toISOString().split('T')[0],
    };

    setPayrollRuns([newRun, ...payrollRuns]);
    setIsProcessing(false);
    setShowProcessModal(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-purple-100 text-purple-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FileText size={28} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Payroll Processing</h1>
            <p className="text-sm text-gray-600 mt-0.5">Generate and process monthly payroll</p>
          </div>
        </div>
        <Button onClick={() => setShowProcessModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Play size={18} className="mr-2" />
          Process Payroll
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: '15', icon: '👥' },
          { label: 'Last Payroll', value: 'Mar 2024', icon: '📅' },
          { label: 'Total Processed', value: '₹20,15,000', icon: '💰' },
          { label: 'Pending Approval', value: '0', icon: '⏳' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Payroll Runs Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payroll Month</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Employees</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Gross Salary</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Deductions</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Net Salary</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payrollRuns.map((run) => (
              <tr key={run.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{run.payrollMonth}</td>
                <td className="px-6 py-4 text-sm text-center text-gray-700">
                  <span className="font-medium">{run.processedEmployees}/{run.totalEmployees}</span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">₹{(run.totalGross).toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 text-sm text-gray-700 text-right">₹{(run.totalDeductions).toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right">₹{(run.totalNet).toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                    {run.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="View Details">
                      <FileText size={16} className="text-blue-600" />
                    </button>
                    {run.status === 'Completed' && (
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Download Payroll">
                        <Download size={16} className="text-green-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Process Payroll Modal */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payroll</DialogTitle>
            <DialogDescription>Generate payroll for selected month</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Payroll Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This will process payroll for all active employees and generate salary slips.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                Review the summary carefully before confirming.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-6">
            <Button variant="outline" onClick={() => setShowProcessModal(false)}>Cancel</Button>
            <Button 
              onClick={handleProcessPayroll}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? 'Processing...' : 'Process Payroll'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
