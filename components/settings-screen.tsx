'use client';

import { useState } from 'react';
import { ChevronRight, ArrowLeft, Upload, Plus, X, Edit2, Download, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailNotificationSetup } from './email-notification-setup';

interface SettingSection {
  id: string;
  title: string;
  description: string;
}

interface CompanyProfileFormData {
  companyName: string;
  legalName: string;
  businessType: 'sole' | 'partnership' | 'pvt-ltd' | 'llp' | '';
  country: string;
  currency: string;
  financialYearStart: string;
  timeZone: string;
  logoUrl?: string;
}

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountType: 'current' | 'savings' | 'credit-card';
  lastImportDate: string;
  status: 'active' | 'archived';
  openingBalance?: number;
  openingDate?: string;
}

interface BankAccountFormData {
  accountName: string;
  bankName: string;
  accountType: 'current' | 'savings' | 'credit-card' | '';
  openingBalance: string;
  openingDate: string;
}

interface BucketAllocationRule {
  id: string;
  bucketName: string;
  type: 'Operating' | 'Reserve' | 'Liability' | 'Owner';
  allocationRule: string;
  status: 'active' | 'disabled';
}

interface BucketAllocationFormData {
  allocationRule: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'accountant' | 'viewer';
  status: 'active' | 'invited';
}

interface InviteUserFormData {
  email: string;
  role: 'accountant' | 'viewer' | '';
}

interface PreferencesFormData {
  dateFormat: 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd';
  numberFormat: 'indian' | 'western';
  defaultReportRange: 'this-month' | 'last-month' | 'this-quarter' | 'this-year';
  defaultInboxStatus: 'needs-info' | 'action-required' | 'recorded';
}

interface HealthScoreThresholds {
  minRunwayMonths: number;
  maxLoanPercentage: number;
  minCashMonths: number;
  maxDSODays: number;
}

interface ExportEvent {
  id: string;
  type: 'data-export' | 'report-export' | 'audit-log' | 'data-reset';
  description: string;
  timestamp: string;
  status: 'completed' | 'pending';
}

const roleDescriptions: Record<string, { title: string; description: string }> = {
  owner: {
    title: 'Owner',
    description: 'Full access. Creates accounts, manages team, and controls settings.',
  },
  accountant: {
    title: 'Accountant / CA',
    description: 'Read everything. Process Inbox. Cannot delete data.',
  },
  viewer: {
    title: 'Viewer',
    description: 'Read-only access to Reports and Invoices only.',
  },
};

const settingSections = [
  {
    id: 'company-profile',
    title: 'Company Profile',
    description: 'Business identity and financial basics.',
  },
  {
    id: 'bank-accounts',
    title: 'Bank Accounts',
    description: 'Manage connected bank accounts and statement sources.',
  },
  {
    id: 'buckets-rules',
    title: 'Buckets & Allocation Rules',
    description: 'Default allocation logic for money.',
  },
  {
    id: 'health-score',
    title: 'Business Health Thresholds',
    description: 'Configure parameters for health score calculation.',
  },
  {
    id: 'email-notifications',
    title: 'Email Notifications',
    description: 'Set up automated email alerts.',
  },
  {
    id: 'users-roles',
    title: 'Users & Roles',
    description: 'Who can see and do what.',
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Dates, currency, defaults.',
  },
  {
    id: 'data-exports',
    title: 'Data & Exports',
    description: 'Download or reset data.',
  },
];

export function SettingsScreen() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string | null>(null);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [showBucketAllocationModal, setShowBucketAllocationModal] = useState(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);
  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [healthScoreThresholds, setHealthScoreThresholds] = useState<HealthScoreThresholds>({
    minRunwayMonths: 3,
    maxLoanPercentage: 10,
    minCashMonths: 2,
    maxDSODays: 45,
  });
  const [formData, setFormData] = useState<CompanyProfileFormData>({
    companyName: 'Acme Studios',
    legalName: 'Acme Studios Private Limited',
    businessType: 'pvt-ltd',
    country: 'India',
    currency: 'INR',
    financialYearStart: 'april',
    timeZone: 'Asia/Kolkata',
  });
  const [bankAccountForm, setBankAccountForm] = useState<BankAccountFormData>({
    accountName: '',
    bankName: '',
    accountType: '',
    openingBalance: '',
    openingDate: '',
  });
  const [bucketAllocationForm, setBucketAllocationForm] = useState<BucketAllocationFormData>({
    allocationRule: '',
  });
  const [inviteUserForm, setInviteUserForm] = useState<InviteUserFormData>({
    email: '',
    role: '',
  });
  const [preferencesForm, setPreferencesForm] = useState<PreferencesFormData>({
    dateFormat: 'dd-mm-yyyy',
    numberFormat: 'indian',
    defaultReportRange: 'this-month',
    defaultInboxStatus: 'needs-info',
  });
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      accountName: 'HDFC – Current',
      bankName: 'HDFC Bank',
      accountType: 'current',
      lastImportDate: 'Feb 4, 2024',
      status: 'active',
      openingBalance: 500000,
      openingDate: 'Jan 1, 2024',
    },
    {
      id: '2',
      accountName: 'ICICI – Savings',
      bankName: 'ICICI Bank',
      accountType: 'savings',
      lastImportDate: 'Feb 2, 2024',
      status: 'active',
      openingBalance: 250000,
      openingDate: 'Jan 1, 2024',
    },
  ]);
  const [bucketAllocationRules, setBucketAllocationRules] = useState<BucketAllocationRule[]>([
    {
      id: '1',
      bucketName: 'Operations',
      type: 'Operating',
      allocationRule: 'Allocate monthly operating expenses such as rent, payroll, and utilities.',
      status: 'active',
    },
    {
      id: '2',
      bucketName: 'Emergency Reserve',
      type: 'Reserve',
      allocationRule: 'Reserve 3 months of operating expenses for emergencies and contingencies.',
      status: 'active',
    },
    {
      id: '3',
      bucketName: 'Tax Liability',
      type: 'Liability',
      allocationRule: 'Set aside 30% of profits quarterly for tax obligations.',
      status: 'active',
    },
    {
      id: '4',
      bucketName: 'Owner Distributions',
      type: 'Owner',
      allocationRule: 'Remaining balance after reserves allocated to owner draws.',
      status: 'disabled',
    },
  ]);
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Priya Sharma',
      email: 'priya@acmestudios.com',
      role: 'owner',
      status: 'active',
    },
    {
      id: '2',
      name: 'Rajesh Desai',
      email: 'rajesh@acmestudios.com',
      role: 'accountant',
      status: 'active',
    },
    {
      id: '3',
      name: 'Finance Team',
      email: 'finance@acmestudios.com',
      role: 'viewer',
      status: 'invited',
    },
  ]);

  const [exportEvents, setExportEvents] = useState<ExportEvent[]>([
    {
      id: '1',
      type: 'data-export',
      description: 'Full data export (CSV)',
      timestamp: 'Feb 3, 2024 at 3:45 PM',
      status: 'completed',
    },
    {
      id: '2',
      type: 'report-export',
      description: 'Reports export (PDF)',
      timestamp: 'Feb 1, 2024 at 2:15 PM',
      status: 'completed',
    },
    {
      id: '3',
      type: 'audit-log',
      description: 'Audit log download',
      timestamp: 'Jan 28, 2024 at 10:30 AM',
      status: 'completed',
    },
  ]);

  if (selectedSection === 'company-profile') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-8 py-12">
          {/* Header with Back Button */}
          <div className="flex items-center gap-3 mb-12">
            <button
              onClick={() => setSelectedSection(null)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Company Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">Business identity and financial basics.</p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Save logic here
            }}
            className="space-y-6"
          >
            {/* Company Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Company Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g., Acme Studios"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Legal Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Legal Name <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                placeholder="e.g., Acme Studios Private Limited"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Business Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Business Type <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Select business type</option>
                <option value="sole">Sole Proprietor</option>
                <option value="partnership">Partnership</option>
                <option value="pvt-ltd">Private Limited</option>
                <option value="llp">LLP</option>
              </select>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Country <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., India"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Currency <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {/* Financial Year Start */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Financial Year Starts <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.financialYearStart}
                onChange={(e) => setFormData({ ...formData, financialYearStart: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="january">January</option>
                <option value="april">April</option>
                <option value="july">July</option>
                <option value="october">October</option>
              </select>
            </div>

            {/* Time Zone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Time Zone <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.timeZone}
                onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Logo <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg bg-muted/20 hover:bg-muted/30 text-foreground transition-colors"
                >
                  <Upload size={16} />
                  Upload Logo
                </button>
                <p className="text-xs text-muted-foreground">Used on invoices and exports</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-border">
              <Button type="submit" className="px-6">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  if (selectedSection === 'buckets-rules') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Header with Back Button */}
          <div className="flex items-center gap-3 mb-12">
            <button
              onClick={() => setSelectedSection(null)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Buckets & Allocation Rules</h1>
              <p className="text-sm text-muted-foreground mt-1">Define default logic for allocating money to each bucket.</p>
            </div>
          </div>

          {/* Buckets Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div>Bucket Name</div>
              <div>Type</div>
              <div className="col-span-2">Default Allocation Rule</div>
              <div>Status</div>
            </div>

            {/* Rows */}
            {bucketAllocationRules.map((bucket) => (
              <div key={bucket.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <div className="grid grid-cols-5 gap-4 px-6 py-4 items-start">
                  <div className="text-sm font-medium text-foreground">{bucket.bucketName}</div>
                  <div className="text-sm text-muted-foreground">{bucket.type}</div>
                  <div className="col-span-2">
                    <p className="text-sm text-foreground leading-relaxed">{bucket.allocationRule}</p>
                  </div>
                  <div className="flex items-center gap-3 justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bucket.status === 'active'}
                        onChange={(e) => {
                          const updatedRules = bucketAllocationRules.map((b) =>
                            b.id === bucket.id ? { ...b, status: e.target.checked ? 'active' : 'disabled' } : b,
                          );
                          setBucketAllocationRules(updatedRules);
                        }}
                        className="w-4 h-4 rounded border border-border bg-input accent-primary cursor-pointer"
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {bucket.status === 'active' ? 'Active' : 'Disabled'}
                      </span>
                    </label>
                    <button
                      onClick={() => {
                        setBucketAllocationForm({ allocationRule: bucket.allocationRule });
                        setEditingBucketId(bucket.id);
                        setShowBucketAllocationModal(true);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit allocation rule"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Allocation Rule Modal */}
          {showBucketAllocationModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background border border-border rounded-lg max-w-md w-full mx-4 shadow-lg">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">Edit Allocation Rule</h2>
                  <button
                    onClick={() => setShowBucketAllocationModal(false)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Allocation Rule Text */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Allocation Rule <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={bucketAllocationForm.allocationRule}
                      onChange={(e) => setBucketAllocationForm({ allocationRule: e.target.value })}
                      placeholder="Describe how money should be allocated to this bucket..."
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Write in plain language. Describe intent, not formulas or percentages.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
                  <button
                    onClick={() => setShowBucketAllocationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={() => {
                      if (editingBucketId && bucketAllocationForm.allocationRule) {
                        const updatedRules = bucketAllocationRules.map((b) =>
                          b.id === editingBucketId ? { ...b, allocationRule: bucketAllocationForm.allocationRule } : b,
                        );
                        setBucketAllocationRules(updatedRules);
                        setShowBucketAllocationModal(false);
                        setEditingBucketId(null);
                      }
                    }}
                  >
                    Save Rule
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (selectedSection === 'bank-accounts') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Header with Back Button and Add CTA */}
          <div className="flex items-center justify-between gap-3 mb-12">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSection(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Bank Accounts</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage connected bank accounts and statement sources.</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setBankAccountForm({ accountName: '', bankName: '', accountType: '', openingBalance: '', openingDate: '' });
                setShowBankAccountModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Bank Account
            </Button>
          </div>

          {/* Bank Accounts Table */}
          {bankAccounts.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Account Name</div>
                <div>Bank Name</div>
                <div>Account Type</div>
                <div>Last Import Date</div>
                <div>Status</div>
                <div></div>
              </div>

              {/* Rows */}
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => setSelectedBankAccount(account.id)}
                  className="grid grid-cols-6 gap-4 px-6 py-3 border-t border-border hover:bg-muted/20 transition-colors cursor-pointer items-center group"
                >
                  <div className="text-sm font-medium text-foreground">{account.accountName}</div>
                  <div className="text-sm text-foreground">{account.bankName}</div>
                  <div className="text-sm text-muted-foreground">
                    {account.accountType === 'current' && 'Current Account'}
                    {account.accountType === 'savings' && 'Savings Account'}
                    {account.accountType === 'credit-card' && 'Credit Card'}
                  </div>
                  <div className="text-sm text-muted-foreground">{account.lastImportDate}</div>
                  <div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      account.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                    }`}>
                      {account.status === 'active' ? 'Active' : 'Archived'}
                    </span>
                  </div>
                  <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground mb-4">No bank accounts connected yet</p>
              <Button
                onClick={() => {
                  setBankAccountForm({ accountName: '', bankName: '', accountType: '', openingBalance: '', openingDate: '' });
                  setShowBankAccountModal(true);
                }}
              >
                Add Your First Bank Account
              </Button>
            </div>
          )}

          {/* Add Bank Account Modal */}
          {showBankAccountModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background border border-border rounded-lg max-w-md w-full mx-4 shadow-lg">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">Add Bank Account</h2>
                  <button
                    onClick={() => setShowBankAccountModal(false)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Account Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Account Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.accountName}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountName: e.target.value })}
                      placeholder="e.g., HDFC – Current"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* Bank Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Bank Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.bankName}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
                      placeholder="e.g., HDFC Bank"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* Account Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Account Type <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={bankAccountForm.accountType}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountType: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      <option value="">Select account type</option>
                      <option value="current">Current Account</option>
                      <option value="savings">Savings Account</option>
                      <option value="credit-card">Credit Card</option>
                    </select>
                  </div>

                  {/* Opening Balance */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Opening Balance <span className="text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <input
                      type="number"
                      value={bankAccountForm.openingBalance}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, openingBalance: e.target.value })}
                      placeholder="e.g., 500000"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* Opening Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Opening Date <span className="text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={bankAccountForm.openingDate}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, openingDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
                  <button
                    onClick={() => setShowBankAccountModal(false)}
                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={() => {
                      if (bankAccountForm.accountName && bankAccountForm.bankName && bankAccountForm.accountType) {
                        const newAccount: BankAccount = {
                          id: (bankAccounts.length + 1).toString(),
                          accountName: bankAccountForm.accountName,
                          bankName: bankAccountForm.bankName,
                          accountType: bankAccountForm.accountType as any,
                          lastImportDate: '—',
                          status: 'active',
                          openingBalance: bankAccountForm.openingBalance ? parseInt(bankAccountForm.openingBalance) : undefined,
                          openingDate: bankAccountForm.openingDate || undefined,
                        };
                        setBankAccounts([...bankAccounts, newAccount]);
                        setShowBankAccountModal(false);
                      }
                    }}
                  >
                    Add Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (selectedSection === 'users-roles') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Header with Back Button and Invite CTA */}
          <div className="flex items-center justify-between gap-3 mb-12">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSection(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Users & Roles</h1>
                <p className="text-sm text-muted-foreground mt-1">Control access without complexity.</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setInviteUserForm({ email: '', role: '' });
                setShowInviteUserModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Invite User
            </Button>
          </div>

          {/* Users Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div></div>
            </div>

            {/* Rows */}
            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-5 gap-4 px-6 py-4 border-t border-border hover:bg-muted/20 transition-colors items-center"
              >
                <div className="text-sm font-medium text-foreground">{user.name}</div>
                <div className="text-sm text-foreground">{user.email}</div>
                <div className="text-sm">
                  {user.role === 'owner' ? (
                    <select
                      value={user.role}
                      disabled
                      className="w-full px-3 py-1 text-sm border border-border rounded-lg bg-input text-foreground cursor-not-allowed opacity-50"
                    >
                      <option value="owner">{roleDescriptions.owner.title}</option>
                    </select>
                  ) : (
                    <select
                      value={user.role}
                      onChange={(e) => {
                        const updatedUsers = users.map((u) =>
                          u.id === user.id ? { ...u, role: e.target.value as 'accountant' | 'viewer' } : u,
                        );
                        setUsers(updatedUsers);
                      }}
                      className="w-full px-3 py-1 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      <option value="accountant">{roleDescriptions.accountant.title}</option>
                      <option value="viewer">{roleDescriptions.viewer.title}</option>
                    </select>
                  )}
                </div>
                <div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    user.status === 'active'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {user.status === 'active' ? 'Active' : 'Invited'}
                  </span>
                </div>
                <div>
                  {user.role !== 'owner' && (
                    <button
                      onClick={() => {
                        const updatedUsers = users.filter((u) => u.id !== user.id);
                        setUsers(updatedUsers);
                      }}
                      className="px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Role Descriptions */}
          <div className="mt-12 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Role Permissions</h2>
            <div className="space-y-3">
              {Object.entries(roleDescriptions).map(([roleKey, role]) => (
                <div key={roleKey} className="p-4 border border-border rounded-lg bg-muted/10">
                  <h3 className="text-sm font-medium text-foreground">{role.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Invite User Modal */}
          {showInviteUserModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background border border-border rounded-lg max-w-md w-full mx-4 shadow-lg">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">Invite User</h2>
                  <button
                    onClick={() => setShowInviteUserModal(false)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={inviteUserForm.email}
                      onChange={(e) => setInviteUserForm({ ...inviteUserForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Role <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={inviteUserForm.role}
                      onChange={(e) => setInviteUserForm({ ...inviteUserForm, role: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      <option value="">Select a role</option>
                      <option value="accountant">Accountant / CA</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {inviteUserForm.role && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {roleDescriptions[inviteUserForm.role as 'accountant' | 'viewer'].description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
                  <button
                    onClick={() => setShowInviteUserModal(false)}
                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={() => {
                      if (inviteUserForm.email && inviteUserForm.role) {
                        const newUser: User = {
                          id: (users.length + 1).toString(),
                          name: inviteUserForm.email.split('@')[0],
                          email: inviteUserForm.email,
                          role: inviteUserForm.role as 'accountant' | 'viewer',
                          status: 'invited',
                        };
                        setUsers([...users, newUser]);
                        setShowInviteUserModal(false);
                      }
                    }}
                  >
                    Send Invite
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (selectedSection === 'email-notifications') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-8 py-12">
          {/* Header with Back Button */}
          <div className="flex items-center gap-3 mb-12">
            <button
              onClick={() => setSelectedSection(null)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Email Notifications</h1>
              <p className="text-sm text-muted-foreground mt-1">Set up automated email alerts for critical events.</p>
            </div>
          </div>

          {/* Email Notification Setup */}
          <EmailNotificationSetup />
        </div>
      </main>
    );
  }

  if (selectedSection === 'health-score') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-8 py-12">
          {/* Header with Back Button */}
          <div className="flex items-center gap-3 mb-12">
            <button
              onClick={() => setSelectedSection(null)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Business Health Thresholds</h1>
              <p className="text-sm text-muted-foreground mt-1">Configure parameters that determine business health scoring.</p>
            </div>
          </div>

          {/* Health Thresholds Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Save thresholds logic here
            }}
            className="space-y-8"
          >
            {/* Minimum Runway Months */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Minimum Runway Months</label>
                <span className="text-lg font-semibold text-primary">{healthScoreThresholds.minRunwayMonths} months</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={healthScoreThresholds.minRunwayMonths}
                onChange={(e) => setHealthScoreThresholds({ ...healthScoreThresholds, minRunwayMonths: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Threshold for &quot;Healthy&quot; status. Below this shows as fair or at-risk.
              </p>
            </div>

            {/* Maximum Loan Percentage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Maximum Loan % of Revenue</label>
                <span className="text-lg font-semibold text-primary">{healthScoreThresholds.maxLoanPercentage}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={healthScoreThresholds.maxLoanPercentage}
                onChange={(e) => setHealthScoreThresholds({ ...healthScoreThresholds, maxLoanPercentage: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Loans as % of monthly revenue. Limits debt burden on business.
              </p>
            </div>

            {/* Minimum Cash Months */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Minimum Cash Position (Months)</label>
                <span className="text-lg font-semibold text-primary">{healthScoreThresholds.minCashMonths} months</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={healthScoreThresholds.minCashMonths}
                onChange={(e) => setHealthScoreThresholds({ ...healthScoreThresholds, minCashMonths: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Target cash reserves to cover monthly expenses.
              </p>
            </div>

            {/* Maximum DSO Days */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Maximum Days Sales Outstanding</label>
                <span className="text-lg font-semibold text-primary">{healthScoreThresholds.maxDSODays} days</span>
              </div>
              <input
                type="range"
                min="15"
                max="90"
                value={healthScoreThresholds.maxDSODays}
                onChange={(e) => setHealthScoreThresholds({ ...healthScoreThresholds, maxDSODays: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Target days to collect from customers. Affects collection efficiency score.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedSection(null)}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                className="flex-1"
              >
                Save Thresholds
              </Button>
            </div>
          </form>

          {/* Health Score Explanation */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-4">How Business Health is Calculated</h3>
            <div className="space-y-3 text-sm text-foreground/80">
              <p>• <strong>Runway Score (40%)</strong>: How many months of cash you have at current burn rate</p>
              <p>• <strong>Loan Ratio (30%)</strong>: Total loan obligations as % of monthly revenue</p>
              <p>• <strong>Cash Position (20%)</strong>: How many months of expenses your cash reserves cover</p>
              <p>• <strong>Collection Efficiency (10%)</strong>: How quickly you collect payments from customers</p>
              <p className="pt-2 italic">Score ≥80 = Healthy | 60-79 = Fair | &lt;60 = At Risk</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (selectedSection === 'preferences') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-8 py-12">
          {/* Header with Back Button */}
          <div className="flex items-center gap-3 mb-12">
            <button
              onClick={() => setSelectedSection(null)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Preferences</h1>
              <p className="text-sm text-muted-foreground mt-1">Customize your workspace defaults.</p>
            </div>
          </div>

          {/* Preferences Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Save preferences logic here
            }}
            className="space-y-8"
          >
            {/* Date Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date Format</label>
              <select
                value={preferencesForm.dateFormat}
                onChange={(e) => setPreferencesForm({ ...preferencesForm, dateFormat: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="dd-mm-yyyy">DD/MM/YYYY</option>
                <option value="mm-dd-yyyy">MM/DD/YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                How dates are displayed throughout Warrior Finance.
              </p>
            </div>

            {/* Number Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Number Format</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="numberFormat"
                    value="indian"
                    checked={preferencesForm.numberFormat === 'indian'}
                    onChange={() => setPreferencesForm({ ...preferencesForm, numberFormat: 'indian' })}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Indian</p>
                    <p className="text-xs text-muted-foreground">₹1,00,000 (10 lakhs)</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="numberFormat"
                    value="western"
                    checked={preferencesForm.numberFormat === 'western'}
                    onChange={() => setPreferencesForm({ ...preferencesForm, numberFormat: 'western' })}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Western</p>
                    <p className="text-xs text-muted-foreground">₹100,000</p>
                  </div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                How numbers and amounts are formatted.
              </p>
            </div>

            {/* Default Report Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Default Report Range</label>
              <select
                value={preferencesForm.defaultReportRange}
                onChange={(e) => setPreferencesForm({ ...preferencesForm, defaultReportRange: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-quarter">This Quarter</option>
                <option value="this-year">This Year</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Default date range when opening Reports.
              </p>
            </div>

            {/* Default Inbox Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Default Inbox Status for New Imports</label>
              <select
                value={preferencesForm.defaultInboxStatus}
                onChange={(e) => setPreferencesForm({ ...preferencesForm, defaultInboxStatus: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="needs-info">Needs Info</option>
                <option value="action-required">Action Required</option>
                <option value="recorded">Recorded</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Status assigned to new imported bank transactions.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-border">
              <Button type="submit" className="px-6">
                Save Preferences
              </Button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  if (selectedSection === 'data-exports') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Header with Back Button */}
          <div className="flex items-center gap-3 mb-12">
            <button
              onClick={() => setSelectedSection(null)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Data & Exports</h1>
              <p className="text-sm text-muted-foreground mt-1">Export your data for backup or analysis.</p>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-6 mb-12">
            {/* Export All Data (CSV) */}
            <div className="border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Download size={18} />
                  Export All Data (CSV)
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Download complete dataset including accounts, transactions, invoices, and bucket records.
                </p>
              </div>
              <Button
                onClick={() => {
                  const newEvent: ExportEvent = {
                    id: (exportEvents.length + 1).toString(),
                    type: 'data-export',
                    description: 'Full data export (CSV)',
                    timestamp: new Date().toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    status: 'completed',
                  };
                  setExportEvents([newEvent, ...exportEvents]);
                }}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                <Download size={16} />
                Download CSV
              </Button>
            </div>

            {/* Export Reports (PDF) */}
            <div className="border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Download size={18} />
                  Export Reports (PDF)
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Download all reports and summaries including bucket health, payables, and unmatched transactions.
                </p>
              </div>
              <Button
                onClick={() => {
                  const newEvent: ExportEvent = {
                    id: (exportEvents.length + 1).toString(),
                    type: 'report-export',
                    description: 'Reports export (PDF)',
                    timestamp: new Date().toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    status: 'completed',
                  };
                  setExportEvents([newEvent, ...exportEvents]);
                }}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                <Download size={16} />
                Download PDFs
              </Button>
            </div>

            {/* Download Audit Log */}
            <div className="border border-border rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Download size={18} />
                  Download Audit Log
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  View record of all data changes, user actions, and system events.
                </p>
              </div>
              <Button
                onClick={() => {
                  const newEvent: ExportEvent = {
                    id: (exportEvents.length + 1).toString(),
                    type: 'audit-log',
                    description: 'Audit log download',
                    timestamp: new Date().toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    status: 'completed',
                  };
                  setExportEvents([newEvent, ...exportEvents]);
                }}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                <Download size={16} />
                Download Log
              </Button>
            </div>
          </div>

          {/* Export History */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Recent Exports</h2>
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Description</div>
                <div>Type</div>
                <div>Date & Time</div>
                <div>Status</div>
              </div>

              {/* Rows */}
              {exportEvents.map((event) => (
                <div
                  key={event.id}
                  className="grid grid-cols-4 gap-4 px-6 py-3 border-t border-border hover:bg-muted/20 transition-colors items-center"
                >
                  <div className="text-sm font-medium text-foreground">{event.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.type === 'data-export' && 'CSV'}
                    {event.type === 'report-export' && 'PDF'}
                    {event.type === 'audit-log' && 'Log'}
                  </div>
                  <div className="text-sm text-muted-foreground">{event.timestamp}</div>
                  <div>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="flex-shrink-0 text-destructive mt-0.5" size={20} />
                <div>
                  <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Irreversible actions. Proceed with caution.
                  </p>
                </div>
              </div>

              {/* Reset Demo Data */}
              <div className="bg-background border border-destructive/20 rounded-lg p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Reset Demo Data</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clear all sample data and start fresh. This cannot be undone.
                  </p>
                </div>
                <Button
                  onClick={() => setShowResetConfirmation(true)}
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 bg-transparent"
                >
                  Reset All Demo Data
                </Button>
              </div>
            </div>
          </div>

          {/* Reset Confirmation Modal */}
          {showResetConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background border border-border rounded-lg max-w-md w-full mx-4 shadow-lg">
                {/* Modal Header */}
                <div className="flex items-center gap-2 px-6 py-4 border-b border-destructive/20 bg-destructive/5">
                  <AlertTriangle className="text-destructive" size={20} />
                  <h2 className="text-lg font-semibold text-destructive">Reset All Data?</h2>
                </div>

                {/* Modal Content */}
                <div className="px-6 py-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">
                      This will permanently delete all data including:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>All transactions and bank data</li>
                      <li>Invoices and payables</li>
                      <li>Bucket allocations</li>
                      <li>Import history</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      Type <span className="font-mono font-semibold text-foreground">reset</span> to confirm:
                    </p>
                    <input
                      type="text"
                      value={resetConfirmationInput}
                      onChange={(e) => setResetConfirmationInput(e.target.value)}
                      placeholder="Type 'reset' to confirm"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
                  <button
                    onClick={() => {
                      setShowResetConfirmation(false);
                      setResetConfirmationInput('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={() => {
                      if (resetConfirmationInput === 'reset') {
                        // Perform reset
                        setExportEvents([
                          {
                            id: (exportEvents.length + 1).toString(),
                            type: 'data-reset',
                            description: 'All demo data reset',
                            timestamp: new Date().toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }),
                            status: 'completed',
                          },
                          ...exportEvents,
                        ]);
                        setShowResetConfirmation(false);
                        setResetConfirmationInput('');
                      }
                    }}
                    disabled={resetConfirmationInput !== 'reset'}
                    className={`${
                      resetConfirmationInput === 'reset'
                        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    Reset Everything
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-8 py-12 space-y-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
        </div>

        {/* Setting Sections */}
        <div className="space-y-3">
          {settingSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className="w-full flex items-start justify-between gap-4 p-5 rounded-lg border border-border bg-card hover:bg-muted/40 hover:border-primary/50 transition-all group"
            >
              <div className="text-left">
                <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {section.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              </div>
              <div className="flex-shrink-0 pt-1 text-muted-foreground group-hover:text-foreground transition-colors">
                <ChevronRight size={20} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
