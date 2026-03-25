'use client';

import { useState } from 'react';
import { Save, Lock, Bell, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PayrollSettings {
  organizationId: string;
  payrollFrequency: 'Monthly' | 'Weekly' | 'Fortnightly' | 'Daily';
  salaryPaymentDate: number; // Day of month
  pfContributionPercentage: number;
  esiContributionPercentage: number;
  tdsEnabled: boolean;
  ptEnabled: boolean;
  gratuityEnabled: boolean;
  bankTransferAutomatic: boolean;
  attendanceTrackingEnabled: boolean;
  salarySlipEmailEnabled: boolean;
  allowNegativeSalary: boolean;
  roundingMethod: 'Round Up' | 'Round Down' | 'Round Off';
  holidayPolicy: 'Exclude' | 'Include' | 'Pro-rata';
  leaveEncashmentEnabled: boolean;
  overtimePolicy: 'None' | 'Fixed Rate' | 'Percentage';
  overtimeRate: number; // Percentage or fixed rate
}

interface TaxSlabs {
  year: number;
  slabs: {
    min: number;
    max: number;
    rate: number;
  }[];
}

export function PayrollSettingsScreen() {
  const [settings, setSettings] = useState<PayrollSettings>({
    organizationId: 'org1',
    payrollFrequency: 'Monthly',
    salaryPaymentDate: 25,
    pfContributionPercentage: 12,
    esiContributionPercentage: 1.36,
    tdsEnabled: true,
    ptEnabled: true,
    gratuityEnabled: true,
    bankTransferAutomatic: true,
    attendanceTrackingEnabled: true,
    salarySlipEmailEnabled: true,
    allowNegativeSalary: false,
    roundingMethod: 'Round Off',
    holidayPolicy: 'Pro-rata',
    leaveEncashmentEnabled: true,
    overtimePolicy: 'Percentage',
    overtimeRate: 50,
  });

  const [taxSlabs, setTaxSlabs] = useState<TaxSlabs>({
    year: 2024,
    slabs: [
      { min: 0, max: 250000, rate: 0 },
      { min: 250001, max: 500000, rate: 5 },
      { min: 500001, max: 750000, rate: 10 },
      { min: 750001, max: 1000000, rate: 15 },
      { min: 1000001, max: 1250000, rate: 20 },
      { min: 1250001, max: 1500000, rate: 25 },
      { min: 1500001, max: Infinity, rate: 30 },
    ],
  });

  const [activeTab, setActiveTab] = useState<'general' | 'contributions' | 'tax' | 'policies'>('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure payroll parameters and compliance settings</p>
        </div>
      </div>

      {/* Save Status */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Bell size={18} />
          <span>Settings saved successfully</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        {['general', 'contributions', 'tax', 'policies'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-border rounded-lg p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Payroll Frequency</label>
                <select
                  value={settings.payrollFrequency}
                  onChange={(e) => setSettings({ ...settings, payrollFrequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                >
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Fortnightly</option>
                  <option>Daily</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Salary Payment Date (Day of Month)</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={settings.salaryPaymentDate}
                  onChange={(e) => setSettings({ ...settings, salaryPaymentDate: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Rounding Method</label>
                <select
                  value={settings.roundingMethod}
                  onChange={(e) => setSettings({ ...settings, roundingMethod: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                >
                  <option>Round Up</option>
                  <option>Round Down</option>
                  <option>Round Off</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Holiday Policy</label>
                <select
                  value={settings.holidayPolicy}
                  onChange={(e) => setSettings({ ...settings, holidayPolicy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                >
                  <option>Exclude</option>
                  <option>Include</option>
                  <option>Pro-rata</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 border-t pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.bankTransferAutomatic}
                  onChange={(e) => setSettings({ ...settings, bankTransferAutomatic: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="font-medium">Automatic Bank Transfer</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.attendanceTrackingEnabled}
                  onChange={(e) => setSettings({ ...settings, attendanceTrackingEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="font-medium">Enable Attendance Tracking</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.salarySlipEmailEnabled}
                  onChange={(e) => setSettings({ ...settings, salarySlipEmailEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="font-medium">Email Salary Slips to Employees</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.leaveEncashmentEnabled}
                  onChange={(e) => setSettings({ ...settings, leaveEncashmentEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="font-medium">Enable Leave Encashment</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowNegativeSalary}
                  onChange={(e) => setSettings({ ...settings, allowNegativeSalary: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="font-medium">Allow Negative Salary (Advance Adjustments)</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">PF Contribution %</label>
                <input
                  type="number"
                  step={0.1}
                  value={settings.pfContributionPercentage}
                  onChange={(e) => setSettings({ ...settings, pfContributionPercentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">Employee + Employer contribution</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ESI Contribution %</label>
                <input
                  type="number"
                  step={0.01}
                  value={settings.esiContributionPercentage}
                  onChange={(e) => setSettings({ ...settings, esiContributionPercentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">Employer contribution only</p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tdsEnabled}
                  onChange={(e) => setSettings({ ...settings, tdsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="font-medium">Enable TDS on Salary</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ptEnabled}
                  onChange={(e) => setSettings({ ...settings, ptEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="font-medium">Enable PT (Professional Tax)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.gratuityEnabled}
                  onChange={(e) => setSettings({ ...settings, gratuityEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="font-medium">Enable Gratuity Calculation</span>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <p className="text-xs font-semibold text-blue-900 mb-2">Compliance Info</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>PF Limit: ₹15,000 per month (or as per current rules)</li>
                <li>ESI Applicability: Wages below ₹21,000 per month</li>
                <li>PT varies by state and salary slab</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Income Tax Slabs (FY {taxSlabs.year})</h3>
              <select
                value={taxSlabs.year}
                onChange={(e) => setTaxSlabs({ ...taxSlabs, year: parseInt(e.target.value) })}
                className="px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option>2023</option>
                <option>2024</option>
                <option>2025</option>
              </select>
            </div>

            <div className="space-y-3">
              {taxSlabs.slabs.map((slab, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground">From</label>
                    <input
                      type="number"
                      value={slab.min}
                      onChange={(e) => {
                        const newSlabs = [...taxSlabs.slabs];
                        newSlabs[idx].min = parseInt(e.target.value);
                        setTaxSlabs({ ...taxSlabs, slabs: newSlabs });
                      }}
                      className="w-full px-2 py-1 border border-border rounded mt-1 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground">To</label>
                    <input
                      type="number"
                      value={slab.max}
                      onChange={(e) => {
                        const newSlabs = [...taxSlabs.slabs];
                        newSlabs[idx].max = parseInt(e.target.value);
                        setTaxSlabs({ ...taxSlabs, slabs: newSlabs });
                      }}
                      className="w-full px-2 py-1 border border-border rounded mt-1 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground">Rate %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={slab.rate}
                      onChange={(e) => {
                        const newSlabs = [...taxSlabs.slabs];
                        newSlabs[idx].rate = parseFloat(e.target.value);
                        setTaxSlabs({ ...taxSlabs, slabs: newSlabs });
                      }}
                      className="w-full px-2 py-1 border border-border rounded mt-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded">
              <p className="text-xs text-amber-900 font-semibold mb-1">Note</p>
              <p className="text-xs text-amber-800">These are standard slabs. Individual deductions and exemptions may apply. Consult with tax professionals for exact calculations.</p>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Overtime Policy</label>
                <select
                  value={settings.overtimePolicy}
                  onChange={(e) => setSettings({ ...settings, overtimePolicy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                >
                  <option>None</option>
                  <option>Fixed Rate</option>
                  <option>Percentage</option>
                </select>
              </div>
              {settings.overtimePolicy !== 'None' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Overtime Rate {settings.overtimePolicy === 'Percentage' ? '(%)' : '(₹/hour)'}
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    value={settings.overtimeRate}
                    onChange={(e) => setSettings({ ...settings, overtimeRate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Financial Statement Integration</h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Auto-create Salary Expense Transactions</p>
                    <p className="text-xs text-muted-foreground">Payroll runs automatically create "Salary & Wages Expense" transactions in financial statements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Statutory Liability Entries</p>
                    <p className="text-xs text-muted-foreground">PF, ESI, PT are recorded as payables in balance sheet</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Bank Transfer Reconciliation</p>
                    <p className="text-xs text-muted-foreground">Salary transfers automatically match to bank reconciliation records</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="gap-2">
          <Save size={18} />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
