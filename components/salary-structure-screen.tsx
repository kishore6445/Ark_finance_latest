'use client';

import { useState } from 'react';
import { DollarSign, Plus, Edit2, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SalaryStructure {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  effectiveFrom: string;
  effectiveTo?: string;
  payrollFrequency: 'Monthly' | 'Weekly' | 'Fortnightly';
  components: {
    basic: number;
    da: number;
    hra: number;
    conveyance: number;
    medical: number;
    otherAllowances: number;
  };
  deductions: {
    pfContribution: number;
    esiContribution: number;
    incomeTax: number;
    professionTax: number;
    otherDeductions: number;
  };
  grossSalary: number;
  status: 'Active' | 'Inactive';
}

export function SalaryStructureScreen() {
  const [structures, setStructures] = useState<SalaryStructure[]>([
    {
      id: '1',
      organizationId: 'org-1',
      employeeId: 'emp-1',
      employeeName: 'Raj Kumar',
      effectiveFrom: '2024-04-01',
      payrollFrequency: 'Monthly',
      components: {
        basic: 30000,
        da: 5000,
        hra: 8000,
        conveyance: 1000,
        medical: 1000,
        otherAllowances: 500,
      },
      deductions: {
        pfContribution: 1800,
        esiContribution: 850,
        incomeTax: 2500,
        professionTax: 200,
        otherDeductions: 0,
      },
      grossSalary: 45500,
      status: 'Active',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<Partial<SalaryStructure>>({
    payrollFrequency: 'Monthly',
    components: {
      basic: 0,
      da: 0,
      hra: 0,
      conveyance: 0,
      medical: 0,
      otherAllowances: 0,
    },
    deductions: {
      pfContribution: 0,
      esiContribution: 0,
      incomeTax: 0,
      professionTax: 0,
      otherDeductions: 0,
    },
  });

  const calculateGrossSalary = (comps: any) => {
    return Object.values(comps).reduce((sum, val) => sum + (val || 0), 0);
  };

  const calculateNetSalary = (comps: any, deducs: any) => {
    return calculateGrossSalary(comps) - Object.values(deducs).reduce((sum, val) => sum + (val || 0), 0);
  };

  const handleAddStructure = () => {
    const newStructure: SalaryStructure = {
      id: Date.now().toString(),
      organizationId: 'org-1',
      employeeId: 'emp-1',
      employeeName: 'Employee Name',
      effectiveFrom: formData.effectiveFrom || new Date().toISOString().split('T')[0],
      payrollFrequency: formData.payrollFrequency || 'Monthly',
      components: formData.components || {},
      deductions: formData.deductions || {},
      grossSalary: calculateGrossSalary(formData.components),
      status: 'Active',
    };

    setStructures([...structures, newStructure]);
    setShowCreateModal(false);
    setFormData({
      payrollFrequency: 'Monthly',
      components: { basic: 0, da: 0, hra: 0, conveyance: 0, medical: 0, otherAllowances: 0 },
      deductions: { pfContribution: 0, esiContribution: 0, incomeTax: 0, professionTax: 0, otherDeductions: 0 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign size={28} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Salary Structure</h1>
            <p className="text-sm text-gray-600 mt-0.5">Define salary components and deductions</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
          <Plus size={18} className="mr-2" />
          New Salary Structure
        </Button>
      </div>

      {/* Salary Structures Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Effective From</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Frequency</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Gross Salary</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {structures.map((structure) => (
              <tr key={structure.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{structure.employeeName}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{structure.effectiveFrom}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{structure.payrollFrequency}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">₹{structure.grossSalary.toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {structure.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit2 size={16} className="text-blue-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Salary Structure</DialogTitle>
            <DialogDescription>Define salary components and deductions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Select Employee</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Raj Kumar</option>
                  <option>Priya Singh</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Effective From</label>
                <input
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData({...formData, effectiveFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Payroll Frequency</label>
                <select
                  value={formData.payrollFrequency}
                  onChange={(e) => setFormData({...formData, payrollFrequency: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                </select>
              </div>
            </div>

            {/* Earnings */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="text-xs font-semibold mb-3 text-blue-900">Earnings Components</h3>
              <div className="grid grid-cols-6 gap-2">
                {['basic', 'da', 'hra', 'conveyance', 'medical', 'otherAllowances'].map((comp) => (
                  <div key={comp}>
                    <label className="block text-xs font-medium mb-1 capitalize">{comp === 'da' ? 'DA' : comp === 'hra' ? 'HRA' : comp === 'otherAllowances' ? 'Other' : comp}</label>
                    <input
                      type="number"
                      value={formData.components?.[comp as keyof typeof formData.components] || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        components: {...formData.components, [comp]: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-red-50 p-3 rounded-lg">
              <h3 className="text-xs font-semibold mb-3 text-red-900">Deductions</h3>
              <div className="grid grid-cols-6 gap-2">
                {['pfContribution', 'esiContribution', 'incomeTax', 'professionTax', 'otherDeductions'].map((ded) => (
                  <div key={ded}>
                    <label className="block text-xs font-medium mb-1 capitalize">{ded === 'pfContribution' ? 'PF' : ded === 'esiContribution' ? 'ESI' : ded === 'professionTax' ? 'PT' : ded === 'otherDeductions' ? 'Other' : ded}</label>
                    <input
                      type="number"
                      value={formData.deductions?.[ded as keyof typeof formData.deductions] || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        deductions: {...formData.deductions, [ded]: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium mb-1">5th Field</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"></div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-3 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <div className="border-r border-green-200 pr-3">
                <p className="text-xs text-gray-600 mb-1">Gross Salary</p>
                <p className="text-xl font-bold text-green-700">₹{calculateGrossSalary(formData.components).toLocaleString('en-IN')}</p>
              </div>
              <div className="border-r border-green-200 pr-3">
                <p className="text-xs text-gray-600 mb-1">Total Deductions</p>
                <p className="text-xl font-bold text-red-700">₹{Object.values(formData.deductions || {}).reduce((a, b) => a + (b || 0), 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600 mb-1">Net Salary</p>
                <p className="text-xl font-bold text-blue-700">₹{calculateNetSalary(formData.components, formData.deductions).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleAddStructure} className="bg-green-600 hover:bg-green-700">Create Structure</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
