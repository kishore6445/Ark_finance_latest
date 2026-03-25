'use client';

import { useState } from 'react';
import { Download, Printer, Mail, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SalarySlip {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  payrollMonth: string;
  employmentType: 'Permanent' | 'Contract' | 'Temporary';
  bankAccount: string;
  pfNumber: string;
  esiNumber: string;
  panNumber: string;
  earnings: {
    basic: number;
    da: number;
    hra: number;
    conveyance: number;
    medical: number;
    other: number;
  };
  deductions: {
    pf: number;
    esi: number;
    incomeTax: number;
    pt: number;
    other: number;
  };
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  ytdGross: number;
  ytdDeductions: number;
  generatedDate: string;
}

interface SalarySlipListItem {
  id: string;
  employeeName: string;
  employeeId: string;
  payrollMonth: string;
  netSalary: number;
  status: 'Generated' | 'Sent' | 'Downloaded' | 'Pending';
  generatedDate: string;
}

export function SalarySlipScreen() {
  const [salarySlips, setSalarySlips] = useState<SalarySlipListItem[]>([
    {
      id: '1',
      employeeName: 'Rajesh Kumar',
      employeeId: 'EMP001',
      payrollMonth: '2024-03',
      netSalary: 64864,
      status: 'Downloaded',
      generatedDate: '2024-03-25',
    },
    {
      id: '2',
      employeeName: 'Priya Sharma',
      employeeId: 'EMP002',
      payrollMonth: '2024-03',
      netSalary: 77110,
      status: 'Sent',
      generatedDate: '2024-03-25',
    },
    {
      id: '3',
      employeeName: 'Amit Patel',
      employeeId: 'EMP003',
      payrollMonth: '2024-03',
      netSalary: 55000,
      status: 'Generated',
      generatedDate: '2024-03-25',
    },
  ]);

  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2024-03');

  const detailedSlips: Record<string, SalarySlip> = {
    '1': {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'Rajesh Kumar',
      designation: 'Senior Developer',
      department: 'Engineering',
      payrollMonth: '2024-03',
      employmentType: 'Permanent',
      bankAccount: 'HDFC****1234',
      pfNumber: 'UP/1234567/00001',
      esiNumber: '33001234567890000',
      panNumber: 'ABCDE1234F',
      earnings: {
        basic: 50000,
        da: 10000,
        hra: 15000,
        conveyance: 2000,
        medical: 1000,
        other: 0,
      },
      deductions: {
        pf: 7200,
        esi: 1236,
        incomeTax: 4500,
        pt: 200,
        other: 0,
      },
      grossSalary: 78000,
      totalDeductions: 13136,
      netSalary: 64864,
      ytdGross: 234000,
      ytdDeductions: 39408,
      generatedDate: '2024-03-25',
    },
  };

  const handleDownload = (slip: SalarySlip) => {
    // Generate PDF-like content (simple text format)
    const content = `
SALARY SLIP
${slip.payrollMonth}

Employee Details:
Name: ${slip.employeeName}
Employee ID: ${slip.employeeId}
Designation: ${slip.designation}
Department: ${slip.department}

Statutory Information:
PF Number: ${slip.pfNumber}
ESI Number: ${slip.esiNumber}
PAN: ${slip.panNumber}

EARNINGS:
Basic Salary           ₹${slip.earnings.basic.toLocaleString()}
DA                     ₹${slip.earnings.da.toLocaleString()}
HRA                    ₹${slip.earnings.hra.toLocaleString()}
Conveyance            ₹${slip.earnings.conveyance.toLocaleString()}
Medical               ₹${slip.earnings.medical.toLocaleString()}
Other                 ₹${slip.earnings.other.toLocaleString()}
---
TOTAL EARNINGS        ₹${slip.grossSalary.toLocaleString()}

DEDUCTIONS:
Provident Fund        ₹${slip.deductions.pf.toLocaleString()}
ESI                   ₹${slip.deductions.esi.toLocaleString()}
Income Tax            ₹${slip.deductions.incomeTax.toLocaleString()}
PT                    ₹${slip.deductions.pt.toLocaleString()}
Other                 ₹${slip.deductions.other.toLocaleString()}
---
TOTAL DEDUCTIONS      ₹${slip.totalDeductions.toLocaleString()}

NET SALARY            ₹${slip.netSalary.toLocaleString()}

YTD Summary:
YTD Gross            ₹${slip.ytdGross.toLocaleString()}
YTD Deductions       ₹${slip.ytdDeductions.toLocaleString()}

Bank Transfer: ${slip.bankAccount}
Generated on: ${slip.generatedDate}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-slip-${slip.employeeName}-${slip.payrollMonth}.txt`;
    a.click();
  };

  const handleViewSlip = (slip: SalarySlipListItem) => {
    const detailedSlip = detailedSlips[slip.id];
    if (detailedSlip) {
      setSelectedSlip(detailedSlip);
      setShowDetailModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salary Slips</h1>
          <p className="text-sm text-muted-foreground mt-1">View, download, and email salary slips to employees</p>
        </div>
      </div>

      {/* Month Selection */}
      <div>
        <label className="text-sm font-medium">Select Month</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="mt-1 px-3 py-2 border border-border rounded-lg w-48"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Slips</p>
          <p className="text-2xl font-bold">{salarySlips.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Generated</p>
          <p className="text-2xl font-bold text-green-600">{salarySlips.filter(s => s.status === 'Generated').length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Sent</p>
          <p className="text-2xl font-bold text-blue-600">{salarySlips.filter(s => s.status === 'Sent').length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Net</p>
          <p className="text-2xl font-bold">₹{(salarySlips.reduce((sum, s) => sum + s.netSalary, 0) / 100000).toFixed(1)}L</p>
        </div>
      </div>

      {/* Salary Slips List */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-muted/40 to-muted/20 border-b">
                <th className="px-4 py-3 text-left font-semibold">Employee</th>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Month</th>
                <th className="px-4 py-3 text-right font-semibold">Net Salary</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Generated</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salarySlips.map((slip) => (
                <tr key={slip.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{slip.employeeName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{slip.employeeId}</td>
                  <td className="px-4 py-3">{slip.payrollMonth}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">₹{slip.netSalary.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      slip.status === 'Downloaded' ? 'bg-green-100 text-green-700' :
                      slip.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                      slip.status === 'Generated' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {slip.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{slip.generatedDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleViewSlip(slip)}
                        className="p-1 hover:bg-muted rounded"
                        title="View Details"
                      >
                        <Eye size={16} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          const detailedSlip = detailedSlips[slip.id];
                          if (detailedSlip) handleDownload(detailedSlip);
                        }}
                        className="p-1 hover:bg-muted rounded"
                        title="Download"
                      >
                        <Download size={16} className="text-muted-foreground" />
                      </button>
                      <button
                        className="p-1 hover:bg-muted rounded"
                        title="Send Email"
                      >
                        <Mail size={16} className="text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSlip && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Salary Slip - {selectedSlip.employeeName} ({selectedSlip.payrollMonth})</DialogTitle>
            </DialogHeader>

            {/* Slip Content */}
            <div className="bg-gray-50 p-6 rounded-lg border border-border space-y-4">
              {/* Header */}
              <div className="border-b pb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Employee Name</p>
                    <p className="font-semibold">{selectedSlip.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Employee ID</p>
                    <p className="font-semibold">{selectedSlip.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Designation</p>
                    <p className="font-semibold">{selectedSlip.designation}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-semibold">{selectedSlip.department}</p>
                  </div>
                </div>
              </div>

              {/* Statutory Info */}
              <div className="border-b pb-4">
                <p className="font-semibold mb-2 text-sm">Statutory Information</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">PF Number</p>
                    <p className="font-medium">{selectedSlip.pfNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ESI Number</p>
                    <p className="font-medium">{selectedSlip.esiNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">PAN</p>
                    <p className="font-medium">{selectedSlip.panNumber}</p>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold mb-2 text-sm">EARNINGS</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Basic</span><span>₹{selectedSlip.earnings.basic.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>DA</span><span>₹{selectedSlip.earnings.da.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>HRA</span><span>₹{selectedSlip.earnings.hra.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Conveyance</span><span>₹{selectedSlip.earnings.conveyance.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Medical</span><span>₹{selectedSlip.earnings.medical.toLocaleString()}</span></div>
                    <div className="border-t pt-1 flex justify-between font-bold"><span>GROSS</span><span>₹{selectedSlip.grossSalary.toLocaleString()}</span></div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-sm">DEDUCTIONS</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>PF</span><span>₹{selectedSlip.deductions.pf.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>ESI</span><span>₹{selectedSlip.deductions.esi.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Income Tax</span><span>₹{selectedSlip.deductions.incomeTax.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>PT</span><span>₹{selectedSlip.deductions.pt.toLocaleString()}</span></div>
                    <div className="border-t pt-1 flex justify-between font-bold"><span>TOTAL</span><span>₹{selectedSlip.totalDeductions.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-white p-3 rounded border-2 border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">NET SALARY</span>
                  <span className="text-2xl font-bold text-green-600">₹{selectedSlip.netSalary.toLocaleString()}</span>
                </div>
              </div>

              {/* YTD Summary */}
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-semibold mb-2 text-sm">YTD Summary</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between"><span>YTD Gross</span><span className="font-medium">₹{selectedSlip.ytdGross.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>YTD Deductions</span><span className="font-medium">₹{selectedSlip.ytdDeductions.toLocaleString()}</span></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
              <Button onClick={() => window.print()} className="gap-2">
                <Printer size={18} />
                Print
              </Button>
              <Button onClick={() => {
                if (selectedSlip) handleDownload(selectedSlip);
              }} className="gap-2">
                <Download size={18} />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
