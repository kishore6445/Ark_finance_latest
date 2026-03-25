'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Plus, Edit2, X, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangeFilter, type DateRange } from './date-range-filter';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrganization } from '@/context/organization-context';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  isIncome: boolean;
  accountingType: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  subtype: string;
  invoice?: string;
  matchedInvoiceId?: string;
  adjustment: 'Full' | 'Partial';
  gstSplit: { taxable: number; gst: number };
  notes: string;
  status: 'Recorded' | 'Needs Info' | 'Action Required';
  allocationStatus: 'Allocated' | 'Partially Allocated' | 'Unallocated';
  bucketId?: string;
  assignedBankAccountId?: string;
  // GST fields
  gstRate?: number;
  gstTreatment?: 'Taxable' | 'Exempt' | 'Nil-rated' | 'RCM';
  itcEligible?: boolean;
  hsnSacCode?: string;
  // Tax breakdown
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  // Allocation fields
  costCenter?: string;
  // Payment & Reconciliation
  paymentStatus?: 'Recorded' | 'Pending Payment' | 'Partially Paid' | 'Paid';
  reconciliationStatus?: 'Unreconciled' | 'Reconciled' | 'Flagged';
  bankStatementReference?: string;
  // Vendor/Customer Info
  vendorCustomerId?: string;
  vendorCustomerName?: string;
  billReferenceNumber?: string;
  paymentMethod?: 'Cash' | 'Check' | 'Wire Transfer' | 'Credit Card' | 'UPI' | 'Cheque';
  // Approval
  approvalStatus?: 'Pending Approval' | 'Approved' | 'Rejected';
  approvedBy?: string;
  // Supporting Document
  attachmentUrl?: string;
  attachmentFileName?: string;
}

interface Invoice {
  id: string;
  number: string;
  partyName: string;
  pendingAmount: number;
}

interface BucketOption {
  id: string;
  name: string;
  type: 'Operating' | 'Reserve' | 'Liability' | 'Owner';
  currentBalance: number;
  monthlyTarget?: number;
  status: 'healthy' | 'attention' | 'critical';
}

type BankAccountOption = {
  id: string;
  label: string;
  balance: number;
};

type AddTransactionFormData = {
  date: string;
  description: string;
  amount: string;
  isIncome: boolean;
  accountingType: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  subtype: string;
  bucketId: string;
  vendorCustomerName: string;
  paymentMethod: string;
  assignedBankAccountId: string;
  invoice: string;
  notes: string;
};

type TransactionRow = {
  id: string;
  date?: string | null;
  description?: string | null;
  amount?: number | null;
  isIncome?: boolean | null;
  is_income?: boolean | null;
  isincome?: boolean | null;
  accountingType?: Transaction['accountingType'] | null;
  accounting_type?: Transaction['accountingType'] | null;
  accountingtype?: Transaction['accountingType'] | null;
  subtype?: string | null;
  bucketId?: string | null;
  bucket_id?: string | null;
  bucketid?: string | null;
  vendorCustomerName?: string | null;
  vendor_customer_name?: string | null;
  vendorcustomername?: string | null;
  paymentMethod?: string | null;
  payment_method?: string | null;
  paymentmethod?: string | null;
  bankAccountId?: string | null;
  bank_account_id?: string | null;
  bankaccountid?: string | null;
  invoiceId?: string | null;
  invoice_id?: string | null;
  invoiceid?: string | null;
  gstAmount?: number | null;
  gst_amount?: number | null;
  gstamount?: number | null;
  taxableAmount?: number | null;
  taxable_amount?: number | null;
  taxableamount?: number | null;
  notes?: string | null;
  status?: string | null;
};

type BucketRow = {
  id: string;
  name: string;
  type?: string | null;
  bucket_type?: string | null;
  current_balance?: number | null;
  balance?: number | null;
  monthly_target?: number | null;
  status?: string | null;
};

type BankAccountRow = {
  id: string;
  account_name?: string | null;
  account_number?: string | null;
  balance?: number | null;
};

const mapTransactionRow = (row: TransactionRow): Transaction => {
  const gstAmount = row.gstAmount ?? row.gst_amount ?? row.gstamount ?? 0;
  const taxableAmount = row.taxableAmount ?? row.taxable_amount ?? row.taxableamount ?? row.amount ?? 0;
  const status = row.status === 'Needs Info' || row.status === 'Action Required' ? row.status : 'Recorded';

  return {
    id: row.id,
    date: row.date ?? '',
    description: row.description ?? '',
    amount: row.amount ?? 0,
    isIncome: row.isIncome ?? row.is_income ?? row.isincome ?? true,
    accountingType: (row.accountingType ?? row.accounting_type ?? row.accountingtype ?? 'Revenue') as Transaction['accountingType'],
    subtype: row.subtype ?? 'Sales',
    bucketId: row.bucketId ?? row.bucket_id ?? row.bucketid ?? undefined,
    vendorCustomerName: row.vendorCustomerName ?? row.vendor_customer_name ?? row.vendorcustomername ?? undefined,
    paymentMethod: (row.paymentMethod ?? row.payment_method ?? row.paymentmethod ?? undefined) as Transaction['paymentMethod'] | undefined,
    assignedBankAccountId: row.bankAccountId ?? row.bank_account_id ?? row.bankaccountid ?? undefined,
    invoice: row.invoiceId ?? row.invoice_id ?? row.invoiceid ?? '',
    adjustment: 'Full',
    gstSplit: {
      taxable: taxableAmount,
      gst: gstAmount,
    },
    notes: row.notes ?? '',
    status,
    allocationStatus: 'Unallocated',
  };
};

const mapBucketRow = (row: BucketRow): BucketOption => ({
  id: row.id,
  name: row.name,
  type: (row.type ?? row.bucket_type ?? 'Operating') as BucketOption['type'],
  currentBalance: row.current_balance ?? row.balance ?? 0,
  monthlyTarget: row.monthly_target ?? undefined,
  status: (row.status ?? 'healthy') as BucketOption['status'],
});

const mapBankAccountRow = (row: BankAccountRow): BankAccountOption => ({
  id: row.id,
  label: `${row.account_name ?? 'Unnamed Account'} - ${(row.account_number ?? '').slice(-4) || '----'}`,
  balance: row.balance ?? 0,
});

const toDatabaseDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(`${value}, ${new Date().getFullYear()}`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return parsed.toISOString().split('T')[0];
};

async function getAccessToken() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Missing session token. Please sign in again.');
  }

  return accessToken;
}

const sampleInvoices: Record<string, Invoice[]> = {
  Revenue: [
    { id: 'inv-1', number: 'INV-001', partyName: 'Acme Studios', pendingAmount: 45000 },
    { id: 'inv-2', number: 'INV-002', partyName: 'Beta Corp', pendingAmount: 28000 },
    { id: 'inv-3', number: 'INV-003', partyName: 'Gamma Ltd', pendingAmount: 12500 },
  ],
  Expense: [
    { id: 'bill-1', number: 'BILL-001', partyName: 'AWS', pendingAmount: 8500 },
    { id: 'bill-2', number: 'BILL-002', partyName: 'Office Supplies Co', pendingAmount: 3200 },
    { id: 'bill-3', number: 'BILL-003', partyName: 'Vendor XYZ', pendingAmount: 15000 },
  ],
};

const subtypeOptions: Record<string, string[]> = {
  Revenue: ['Sales', 'Service Income', 'Interest Income', 'Dividend Income', 'Investment Returns', 'Other Income'],
  Expense: ['Operating', 'COGS', 'Travel', 'Utilities', 'Salaries', 'Rent', 'Depreciation', 'Finance Costs', 'Insurance', 'Marketing', 'Professional Fees', 'Other'],
  Asset: ['Cash', 'Inventory', 'Equipment', 'Receivables', 'Other'],
  Liability: ['Accounts Payable', 'Loans', 'GST Payable', 'Employee Benefits', 'Other'],
};

// GST Configuration
const gstRateOptions = ['5%', '12%', '18%', '28%', 'Exempt', 'Nil-rated'];
const gstTreatmentOptions = ['Taxable', 'Exempt', 'Nil-rated', 'RCM'];
const hsnSacOptions = [
  { code: '1001', description: 'Wheat' },
  { code: '1002', description: 'Rice' },
  { code: '5411', description: 'Software Services' },
  { code: '9965', description: 'Consulting Services' },
  { code: '9966', description: 'Professional Services' },
];

// Cost Centers
const costCenterOptions = [
  { id: 'cc-001', label: 'Product Development' },
  { id: 'cc-002', label: 'Marketing' },
  { id: 'cc-003', label: 'Operations' },
  { id: 'cc-004', label: 'HR & Admin' },
  { id: 'cc-005', label: 'Finance' },
];

// Payment & Reconciliation Options
const paymentStatusOptions = ['Recorded', 'Pending Payment', 'Partially Paid', 'Paid'];
const reconciliationStatusOptions = ['Unreconciled', 'Reconciled', 'Flagged'];
const paymentMethodOptions = ['Cash', 'Check', 'Wire Transfer', 'Credit Card', 'UPI', 'Cheque'];
const approvalStatusOptions = ['Pending Approval', 'Approved', 'Rejected'];

interface InboxScreenProps {
  onNavigate?: (nav: string) => void;
}

export function FinanceInboxScreen({ onNavigate }: InboxScreenProps) {
  const { currentOrganization } = useOrganization();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [buckets, setBuckets] = useState<BucketOption[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Transaction> | null>(null);
  const [openDropdown, setOpenDropdown] = useState<{ txnId: string; field: string } | null>(null);
  const [lastUsedType, setLastUsedType] = useState<'Revenue' | 'Expense' | 'Asset' | 'Liability'>('Revenue');
  const [hoverRowId, setHoverRowId] = useState<string | null>(null);
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteProtectPassword, setDeleteProtectPassword] = useState<string>('');
  const formatDateToISO = (date: Date) => date.toISOString().split('T')[0];

  const getDefaultDateRange = (): DateRange => {
    const today = new Date();
    return {
      start: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`,
      end: formatDateToISO(today),
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [timePeriodFilter, setTimePeriodFilter] = useState<'today' | 'month' | 'quarter' | 'year' | null>('month');
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'recorded' | 'needs-info' | 'action-required' | 'unallocated'>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTransactionForDrawer, setSelectedTransactionForDrawer] = useState<Transaction | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [effectiveOrganizationId, setEffectiveOrganizationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [addFormData, setAddFormData] = useState<AddTransactionFormData>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    isIncome: true,
    accountingType: 'Revenue',
    subtype: subtypeOptions.Revenue[0],
    bucketId: '',
    vendorCustomerName: '',
    paymentMethod: '',
    assignedBankAccountId: '',
    invoice: '',
    notes: '',
  });

  // Calculate date range based on time period filter
  const getDateRangeForPeriod = (period: 'today' | 'month' | 'quarter' | 'year') => {
    const today = new Date();
    const todayISO = formatDateToISO(today);
    const year = today.getFullYear();
    const month = today.getMonth();

    switch (period) {
      case 'today':
        return {
          start: todayISO,
          end: todayISO,
        };
      case 'month':
        return {
          start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
          end: todayISO,
        };
      case 'quarter':
        const quarterStart = Math.floor(month / 3) * 3;
        return {
          start: `${year}-${String(quarterStart + 1).padStart(2, '0')}-01`,
          end: todayISO,
        };
      case 'year':
        return {
          start: `${year}-01-01`,
          end: todayISO,
        };
      default:
        return getDefaultDateRange();
    }
  };

  const handleTimePeriodFilter = (period: 'today' | 'month' | 'quarter' | 'year') => {
    setTimePeriodFilter(period);
    setDateRange(getDateRangeForPeriod(period));
  };

  useEffect(() => {
    let isMounted = true;

    const resolveIdentity = async () => {
      if (currentOrganization?.id) {
        setEffectiveOrganizationId(currentOrganization.id);
      }

      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id ?? null;
      if (isMounted) {
        setCurrentUserId(userId);
      }

      if (currentOrganization?.id || !userId) {
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userId)
        .maybeSingle();

      if (isMounted) {
        setEffectiveOrganizationId(profile?.organization_id ?? null);
      }
    };

    void resolveIdentity();

    return () => {
      isMounted = false;
    };
  }, [currentOrganization]);

  const fetchTransactions = useCallback(async () => {
    if (!effectiveOrganizationId) {
      setTransactions([]);
      return;
    }

    setError(null);
    try {
      const accessToken = await getAccessToken();
      const query = new URLSearchParams({
        userId: currentUserId ?? '',
        organizationId: effectiveOrganizationId,
      });

      const response = await fetch(`/api/transactions?${query.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-access-token': accessToken,
          'x-user-id': currentUserId ?? '',
          'x-organization-id': effectiveOrganizationId,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to load transactions.');
      }

      setTransactions(((result.transactions ?? []) as TransactionRow[]).map(mapTransactionRow));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load transactions.');
    }
  }, [currentUserId, effectiveOrganizationId]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const fetchBuckets = useCallback(async () => {
    if (!effectiveOrganizationId) {
      setBuckets([]);
      return;
    }

    setError(null);

    try {
      const accessToken = await getAccessToken();
      const query = new URLSearchParams({
        userId: currentUserId ?? '',
        organizationId: effectiveOrganizationId,
      });

      const response = await fetch(`/api/buckets?${query.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-access-token': accessToken,
          'x-user-id': currentUserId ?? '',
          'x-organization-id': effectiveOrganizationId,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to load buckets.');
      }

      setBuckets(((result.buckets ?? []) as BucketRow[]).map(mapBucketRow));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load buckets.');
    }
  }, [currentUserId, effectiveOrganizationId]);

  useEffect(() => {
    void fetchBuckets();
  }, [fetchBuckets]);

  const fetchBankAccounts = useCallback(async () => {
    if (!effectiveOrganizationId) {
      setBankAccounts([]);
      return;
    }

    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/bank-accounts', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to load bank accounts.');
      }

      setBankAccounts(((result.accounts ?? []) as BankAccountRow[]).map(mapBankAccountRow));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load bank accounts.');
    }
  }, [effectiveOrganizationId]);

  useEffect(() => {
    void fetchBankAccounts();
  }, [fetchBankAccounts]);

  useEffect(() => {
    if (!addFormData.bucketId) {
      return;
    }

    const bucketStillExists = buckets.some((bucket) => bucket.id === addFormData.bucketId);
    if (!bucketStillExists) {
      setAddFormData((prev) => ({ ...prev, bucketId: '' }));
    }
  }, [addFormData.bucketId, buckets]);

  useEffect(() => {
    if (!addFormData.assignedBankAccountId) {
      return;
    }

    const bankAccountStillExists = bankAccounts.some((account) => account.id === addFormData.assignedBankAccountId);
    if (!bankAccountStillExists) {
      setAddFormData((prev) => ({ ...prev, assignedBankAccountId: '' }));
    }
  }, [addFormData.assignedBankAccountId, bankAccounts]);

  // Calculate allocation summary
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      if (statusFilter === 'recorded' && t.status !== 'Recorded') return false;
      if (statusFilter === 'needs-info' && t.status !== 'Needs Info') return false;
      if (statusFilter === 'action-required' && t.status !== 'Action Required') return false;
      if (statusFilter === 'unallocated' && t.allocationStatus !== 'Unallocated') return false;
      return true;
    });
  };

  const calculateAllocationSummary = () => {
    const filtered = getFilteredTransactions();
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    const allocated = filtered.filter(t => t.allocationStatus === 'Allocated').reduce((sum, t) => sum + t.amount, 0);
    const partiallyAllocated = filtered.filter(t => t.allocationStatus === 'Partially Allocated').reduce((sum, t) => sum + t.amount, 0);
    const unallocated = filtered.filter(t => t.allocationStatus === 'Unallocated').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      total,
      allocated,
      partiallyAllocated,
      unallocated,
      allocatedPercentage: total > 0 ? Math.round((allocated / total) * 100) : 0,
      unallocatedPercentage: total > 0 ? Math.round((unallocated / total) * 100) : 0,
    };
  };

  const getStatusCounts = () => {
    return {
      all: transactions.length,
      recorded: transactions.filter(t => t.status === 'Recorded').length,
      'needs-info': transactions.filter(t => t.status === 'Needs Info').length,
      'action-required': transactions.filter(t => t.status === 'Action Required').length,
      unallocated: transactions.filter(t => t.allocationStatus === 'Unallocated').length,
    };
  };

  const startEditMode = (txn: Transaction) => {
    // Auto-cancel current edit if switching rows
    if (editingRowId && editingRowId !== txn.id) {
      cancelEditMode();
    }
    setEditingRowId(txn.id);
    setEditFormData({ ...txn });
    setOpenDropdown(null);
  };

  const cancelEditMode = () => {
    if (editingRowId && editFormData && editFormData.id && !transactions.find(t => t.id === editFormData.id)) {
      // If this is a new unsaved transaction, remove it
      setTransactions(transactions.filter(t => t.id !== editingRowId));
    }
    setEditingRowId(null);
    setEditFormData(null);
    setOpenDropdown(null);
  };

  const persistTransaction = async (transaction: Transaction, sourceId: string) => {
    if (!effectiveOrganizationId) {
      return null;
    }

    const accessToken = await getAccessToken();
    const payload = {
      ...(sourceId.startsWith('new-') ? {} : { id: sourceId }),
      date: toDatabaseDate(transaction.date),
      description: transaction.description,
      amount: Number(transaction.amount) || 0,
      is_income: transaction.isIncome,
      accounting_type: transaction.accountingType,
      subtype: transaction.subtype,
      bucket_id: transaction.bucketId || null,
      vendor_customer_name: transaction.vendorCustomerName || null,
      payment_method: transaction.paymentMethod || null,
      bank_account_id: transaction.assignedBankAccountId || null,
      invoice_reference: transaction.invoice || null,
      status: transaction.status,
      gst_taxable: transaction.gstSplit?.taxable ?? transaction.amount,
      gst_amount: transaction.gstSplit?.gst ?? 0,
      notes: transaction.notes,
    };

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-access-token': accessToken,
        'x-user-id': currentUserId ?? '',
        'x-organization-id': effectiveOrganizationId,
      },
      body: JSON.stringify({
        accessToken,
        userId: currentUserId,
        organizationId: effectiveOrganizationId,
        transaction: payload,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error ?? 'Failed to save transaction.');
    }

    return result.transaction ? mapTransactionRow(result.transaction as TransactionRow) : null;
  };

  const saveTransaction = async () => {
    if (editingRowId && editFormData) {
      const previousTransaction = transactions.find((t) => t.id === editingRowId);
      const mergedTransaction = { ...previousTransaction, ...editFormData } as Transaction;

      // Track the last used type for next transaction
      setLastUsedType(editFormData.accountingType || 'Revenue');
      setTransactions(transactions.map(t => (t.id === editingRowId ? { ...t, ...editFormData } : t)));
      setEditingRowId(null);
      setEditFormData(null);
      setOpenDropdown(null);

      if (!effectiveOrganizationId) {
        return;
      }

      try {
        const persistedTransaction = await persistTransaction(mergedTransaction, editingRowId);
        if (persistedTransaction) {
          setTransactions((prev) =>
            prev.map((t) => (t.id === editingRowId ? persistedTransaction : t))
          );
        }
        notifyTransactionsUpdated();
      } catch (err: any) {
        setError(err?.message ?? 'Failed to save transaction.');
      }
    }
  };

  const addNewTransaction = () => {
    const newId = `new-${Date.now()}`;
    const newTxn: Transaction = {
      id: newId,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      description: '',
      amount: 0,
      isIncome: true,
      accountingType: lastUsedType,
      subtype: subtypeOptions[lastUsedType]?.[0] || 'Sales',
      invoice: '',
      adjustment: 'Full',
      gstSplit: { taxable: 0, gst: 0 },
      notes: '',
      status: 'Recorded',
      allocationStatus: 'Unallocated',
    };
    setTransactions([newTxn, ...transactions]);
    startEditMode(newTxn);
  };

  const resetAddForm = () => {
    const defaultType = lastUsedType;
    setAddFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      isIncome: defaultType !== 'Expense',
      accountingType: defaultType,
      subtype: subtypeOptions[defaultType]?.[0] || 'Sales',
      bucketId: '',
      vendorCustomerName: '',
      paymentMethod: '',
      assignedBankAccountId: '',
      invoice: '',
      notes: '',
    });
  };

  const openAddForm = () => {
    resetAddForm();
    setShowAddForm(true);
  };

  const notifyTransactionsUpdated = () => {
    window.dispatchEvent(new Event('finance:transactions-updated'));
  };

  const saveAddTransactionForm = async () => {
    
    const parsedAmount = Number.parseFloat(addFormData.amount);
    let missingFields = [];
    if (!addFormData.date) missingFields.push('date');
    if (!addFormData.description.trim()) missingFields.push('description');
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) missingFields.push('amount');
    if (!addFormData.bucketId) missingFields.push('bucket');
    if (missingFields.length > 0) {
      setError('Please fill required fields: ' + missingFields.join(', '));
      return;
    }

    const tempId = `new-${Date.now()}`;
    const newTransaction: Transaction = {
      id: tempId,
      date: addFormData.date,
      description: addFormData.description.trim(),
      amount: parsedAmount,
      isIncome: addFormData.isIncome,
      accountingType: addFormData.accountingType,
      subtype: addFormData.subtype,
      invoice: addFormData.invoice || '',
      adjustment: 'Full',
      gstSplit: { taxable: parsedAmount, gst: 0 },
      notes: addFormData.notes,
      status: 'Recorded',
      allocationStatus: 'Unallocated',
      bucketId: addFormData.bucketId,
      assignedBankAccountId: addFormData.assignedBankAccountId || undefined,
      vendorCustomerName: addFormData.vendorCustomerName || undefined,
      paymentMethod: (addFormData.paymentMethod || undefined) as Transaction['paymentMethod'] | undefined,
    };

    console.log('Adding transaction:', newTransaction);

    setIsAddingTransaction(true);
    setError(null);

    try {
      const persistedTransaction = await persistTransaction(newTransaction, tempId);
      const transactionToAdd = persistedTransaction ?? newTransaction;
      setTransactions((prev) => [transactionToAdd, ...prev]);
      setLastUsedType(addFormData.accountingType);
      setShowAddForm(false);
      resetAddForm();
      notifyTransactionsUpdated();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add transaction.');
    } finally {
      setIsAddingTransaction(false);
    }
  };

  // Auto-focus description field when entering edit mode
  useEffect(() => {
    if (editingRowId && descriptionInputRef.current) {
      setTimeout(() => descriptionInputRef.current?.focus(), 0);
    }
  }, [editingRowId]);

  // Calculate bucket allocations
  const calculateBucketAllocation = (bucketId: string) => {
    const allocated = transactions
      .filter(txn => txn.bucketId === bucketId)
      .reduce((sum, txn) => sum + txn.amount, 0);
    return allocated;
  };

  // Get bucket status (healthy, warning, critical)
  const getBucketStatus = (allocated: number, capacity: number) => {
    const percentage = (allocated / capacity) * 100;
    if (percentage > 100) return { status: 'critical', color: 'bg-red-500', label: 'Over Capacity' };
    if (percentage > 80) return { status: 'warning', color: 'bg-yellow-500', label: 'Near Capacity' };
    return { status: 'healthy', color: 'bg-green-500', label: 'Healthy' };
  };

  const deleteTransaction = async (id: string) => {
    if (id.startsWith('new-')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (editingRowId === id) {
        cancelEditMode();
      }
      setDeleteConfirmId(null);
      setOpenMoreMenuId(null);
      setDeleteProtectPassword('');
      return;
    }

    if (!effectiveOrganizationId) {
      setError('No organization linked to this user.');
      return;
    }

    setDeletingTransactionId(id);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const query = new URLSearchParams({
        id,
        userId: currentUserId ?? '',
        organizationId: effectiveOrganizationId,
      });

      const response = await fetch(`/api/transactions?${query.toString()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-access-token': accessToken,
          'x-user-id': currentUserId ?? '',
          'x-organization-id': effectiveOrganizationId,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to delete transaction.');
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (editingRowId === id) {
        cancelEditMode();
      }
      if (selectedTransactionForDrawer?.id === id) {
        setDrawerOpen(false);
        setSelectedTransactionForDrawer(null);
      }
      setDeleteConfirmId(null);
      setOpenMoreMenuId(null);
      setDeleteProtectPassword('');
      notifyTransactionsUpdated();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete transaction.');
    } finally {
      setDeletingTransactionId(null);
    }
  };

  // Check if transaction is protected (has invoice, GST, or is in bucket totals)
  const isTransactionProtected = (txn: Transaction): boolean => {
    return !!(txn.invoice || txn.gstSplit?.gst > 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Recorded':
        return 'text-accent bg-accent/10';
      case 'Needs Info':
        return 'text-warning bg-warning/10';
      case 'Action Required':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  const getAmountColor = (isIncome: boolean) => {
    return isIncome ? 'text-accent' : 'text-destructive';
  };

  const CompactDropdown = ({
    value,
    onChange,
    options,
    txnId,
    field,
  }: {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    txnId: string;
    field: string;
  }) => {
    const isOpen = openDropdown?.txnId === txnId && openDropdown?.field === field;
    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : { txnId, field })}
          className="h-7 px-2 text-xs border border-border rounded bg-input hover:border-primary transition-colors flex items-center gap-1 min-w-24 truncate"
        >
          <span className="truncate">{value}</span>
          <ChevronDown size={12} className="flex-shrink-0 text-muted-foreground" />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded shadow-lg z-50 min-w-40 max-h-48 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const isEditing = (txnId: string) => editingRowId === txnId;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header with Date Filter */}
      <div className="px-8 pt-6 pb-6 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Process transactions in seconds</p>
          <Button
            onClick={openAddForm}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Transaction
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex flex-col gap-3">
          {/* Quick Time Period Filters */}
          <div className="flex gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'month', label: 'This Month' },
              { id: 'quarter', label: 'This Quarter' },
              { id: 'year', label: 'This Year' },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => handleTimePeriodFilter(period.id as 'today' | 'month' | 'quarter' | 'year')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  timePeriodFilter === period.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          {/* DateRangeFilter below quick filters */}
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          {[
            { id: 'all', label: 'All', count: getStatusCounts().all },
            { id: 'recorded', label: 'Recorded', count: getStatusCounts().recorded },
            { id: 'needs-info', label: 'Needs Info', count: getStatusCounts()['needs-info'] },
            { id: 'action-required', label: 'Action Required', count: getStatusCounts()['action-required'] },
            { id: 'unallocated', label: 'Unallocated', count: getStatusCounts().unallocated },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === filter.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-foreground hover:bg-muted'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-auto px-8">
        <div className="min-w-full">
          {/* Add Transaction Form - Inline Row */}
          {editingRowId && editingRowId.startsWith('new-') && editFormData && (
            <div className="grid grid-cols-12 gap-4 p-4 bg-blue-50/30 dark:bg-blue-950/20 rounded-lg mb-4 items-center border-2 border-blue-200 dark:border-blue-800">
              <input
                type="date"
                value={editFormData.date || ''}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                className="col-span-1 px-3 py-2 bg-background border border-border rounded text-sm"
                placeholder="Date"
              />
              <input
                type="text"
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="col-span-3 px-3 py-2 bg-background border border-border rounded text-sm"
                placeholder="Description"
                ref={descriptionInputRef}
              />
              <input
                type="number"
                value={editFormData.amount || ''}
                onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) || 0 })}
                className="col-span-2 px-3 py-2 bg-background border border-border rounded text-sm"
                placeholder="Amount"
              />
              <select
                value={editFormData.accountingType || 'Revenue'}
                onChange={(e) => {
                  const newType = e.target.value as any;
                  setEditFormData({
                    ...editFormData,
                    accountingType: newType,
                    subtype: subtypeOptions[newType]?.[0] || '',
                  });
                }}
                className="col-span-2 px-3 py-2 bg-background border border-border rounded text-sm"
              >
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
              </select>
              <select
                value={editFormData.subtype || ''}
                onChange={(e) => setEditFormData({ ...editFormData, subtype: e.target.value })}
                className="col-span-2 px-3 py-2 bg-background border border-border rounded text-sm"
              >
                {subtypeOptions[editFormData.accountingType || 'Revenue']?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="col-span-2 flex gap-1 justify-end">
                <button
                  onClick={saveTransaction}
                  className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  ✓
                </button>
                <button
                  onClick={cancelEditMode}
                  className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-t-lg sticky top-0 z-10">
            <div className="col-span-1 text-xs font-semibold text-muted-foreground uppercase">Date</div>
            <div className="col-span-3 text-xs font-semibold text-muted-foreground uppercase">Description</div>
            <div className="col-span-1 text-xs font-semibold text-muted-foreground uppercase">Amount</div>
            <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase">Type</div>
            <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase">Subtype</div>
            <div className="col-span-1 text-xs font-semibold text-muted-foreground uppercase">Status</div>
            <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</div>
          </div>

          {/* Transaction Rows */}
          <div className="space-y-2">
            {getFilteredTransactions().map((txn, idx) => (
              <div
                key={txn.id}
                className={`grid grid-cols-12 gap-4 p-4 rounded-lg border transition-all ${
                  editingRowId === txn.id
                    ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                    : idx % 2 === 0
                    ? 'bg-muted/30 border-border/50'
                    : 'bg-background border-border/30'
                }`}
              >
                <div className="col-span-1 text-sm font-medium text-foreground">{txn.date}</div>
                <div className="col-span-3 text-sm text-foreground truncate">{txn.description}</div>
                <div className="col-span-1 text-sm font-semibold text-foreground">₹{txn.amount.toLocaleString('en-IN')}</div>
                <div className="col-span-2 text-sm text-foreground">{txn.accountingType}</div>
                <div className="col-span-2 text-sm text-muted-foreground">{txn.subtype}</div>
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    txn.status === 'Recorded' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    txn.status === 'Needs Info' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                  }`}>
                    {txn.status}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setDrawerOpen(true);
                      setSelectedTransactionForDrawer(txn);
                    }}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void deleteTransaction(txn.id)}
                    disabled={deletingTransactionId === txn.id}
                    className="px-3 py-1 bg-red-600/20 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded text-xs hover:bg-red-600/30"
                  >
                    {deletingTransactionId === txn.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Allocation Summary Footer */}
      <div className="sticky bottom-0 bg-background border-t border-border px-8 py-4">
        {(() => {
          const summary = calculateAllocationSummary();
          return (
            <div className="flex gap-6">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
                <p className="text-lg font-semibold text-foreground">₹{summary.total.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Allocated</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-green-600">₹{summary.allocated.toLocaleString('en-IN')}</p>
                  <span className="text-xs font-medium text-muted-foreground">({summary.allocatedPercentage}%)</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Partially Allocated</p>
                <p className="text-lg font-semibold text-yellow-600">₹{summary.partiallyAllocated.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Pending Allocation</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-red-600">₹{summary.unallocated.toLocaleString('en-IN')}</p>
                  <span className="text-xs font-medium text-muted-foreground">({summary.unallocatedPercentage}%)</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {showAddForm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowAddForm(false)} />
          <div className="fixed inset-x-0 top-10 z-50 mx-auto w-full max-w-3xl rounded-xl border border-border bg-background shadow-2xl">
            <div className="p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">Add Transaction_test</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Date *</label>
                  <input
                    type="date"
                    value={addFormData.date}
                    onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                    value={addFormData.amount}
                    onChange={(e) => setAddFormData({ ...addFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Description *</label>
                  <input
                    type="text"
                    placeholder="Enter transaction description"
                    value={addFormData.description}
                    onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Money Direction *</label>
                  <select
                    value={addFormData.isIncome ? 'inflow' : 'outflow'}
                    onChange={(e) => setAddFormData({ ...addFormData, isIncome: e.target.value === 'inflow' })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    <option value="inflow">Inflow</option>
                    <option value="outflow">Outflow</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Accounting Type *</label>
                  <select
                    value={addFormData.accountingType}
                    onChange={(e) => {
                      const nextType = e.target.value as AddTransactionFormData['accountingType'];
                      setAddFormData({
                        ...addFormData,
                        accountingType: nextType,
                        subtype: subtypeOptions[nextType]?.[0] || '',
                        isIncome: nextType !== 'Expense',
                        invoice: '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Subtype *</label>
                  <select
                    value={addFormData.subtype}
                    onChange={(e) => setAddFormData({ ...addFormData, subtype: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    {subtypeOptions[addFormData.accountingType]?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Bucket *</label>
                  <select
                    value={addFormData.bucketId}
                    onChange={(e) => setAddFormData({ ...addFormData, bucketId: e.target.value })}
                    disabled={buckets.length === 0}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    <option value="">{buckets.length === 0 ? 'No buckets created' : 'Select Bucket'}</option>
                    {buckets.map((bucket) => (
                      <option key={bucket.id} value={bucket.id}>{bucket.name}</option>
                    ))}
                  </select>
                  {buckets.length === 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">Create a bucket first to assign this transaction.</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Vendor / Customer (Optional)</label>
                  <input
                    type="text"
                    value={addFormData.vendorCustomerName}
                    onChange={(e) => setAddFormData({ ...addFormData, vendorCustomerName: e.target.value })}
                    placeholder="Name"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Payment Method (Optional)</label>
                  <select
                    value={addFormData.paymentMethod}
                    onChange={(e) => setAddFormData({ ...addFormData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    <option value="">Select Payment Method</option>
                    {paymentMethodOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Bank Account (Optional)</label>
                  <select
                    value={addFormData.assignedBankAccountId}
                    onChange={(e) => setAddFormData({ ...addFormData, assignedBankAccountId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    <option value="">Select Bank Account</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Linked Invoice (Optional)</label>
                  <select
                    value={addFormData.invoice}
                    onChange={(e) => setAddFormData({ ...addFormData, invoice: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    <option value="">Select Invoice</option>
                    {(sampleInvoices[addFormData.accountingType] || []).map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.number} - {inv.partyName}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Notes (Optional)</label>
                  <textarea
                    value={addFormData.notes}
                    onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
                    placeholder="Add transaction notes"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm min-h-20 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={isAddingTransaction}
                >
                  Cancel
                </Button>
                <Button onClick={saveAddTransactionForm} disabled={isAddingTransaction}>
                  {isAddingTransaction ? 'Saving...' : 'Save Transaction_test'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {drawerOpen && selectedTransactionForDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => {
              setDrawerOpen(false);
              setSelectedTransactionForDrawer(null);
            }}
          />

          {/* Drawer Panel - slides from right */}
          <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-2xl overflow-y-auto z-50">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-4 sticky top-0 bg-background z-10">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Edit Transaction</h2>
                  <p className="text-xs text-muted-foreground mt-1">{selectedTransactionForDrawer.description}</p>
                </div>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setSelectedTransactionForDrawer(null);
                  }}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              {/* Transaction Summary */}
              <div className="bg-muted/30 p-3 rounded space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <span className="text-sm font-semibold text-foreground">₹{selectedTransactionForDrawer.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Type</span>
                  <span className="text-sm font-semibold text-foreground">{selectedTransactionForDrawer.accountingType} - {selectedTransactionForDrawer.subtype}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <span className="text-sm font-semibold text-foreground">{selectedTransactionForDrawer.date}</span>
                </div>

                <div className="pt-2">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Edit Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedTransactionForDrawer.amount || 0}
                    onChange={(e) =>
                      setSelectedTransactionForDrawer({
                        ...selectedTransactionForDrawer,
                        amount: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* GST Section */}
              <div className="space-y-3 border-b border-border pb-6">
                <h3 className="font-semibold text-foreground text-sm">GST Configuration</h3>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">GST Rate</label>
                  <select
                    value={selectedTransactionForDrawer.gstRate?.toString() || '0'}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, gstRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    {gstRateOptions.map(opt => <option key={opt} value={opt === 'Exempt' || opt === 'Nil-rated' ? '0' : opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">GST Treatment</label>
                  <select
                    value={selectedTransactionForDrawer.gstTreatment || 'Taxable'}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, gstTreatment: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    {gstTreatmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">HSN/SAC Code</label>
                  <select
                    value={selectedTransactionForDrawer.hsnSacCode || ''}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, hsnSacCode: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    <option value="">Select HSN/SAC</option>
                    {hsnSacOptions.map(opt => <option key={opt.code} value={opt.code}>{opt.code} - {opt.description}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    checked={selectedTransactionForDrawer.itcEligible || false}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, itcEligible: e.target.checked })}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                    id="drawer-itc"
                  />
                  <label htmlFor="drawer-itc" className="text-sm font-medium text-foreground cursor-pointer">
                    ITC Eligible
                  </label>
                </div>
              </div>

              {/* Tax Breakdown Section */}
              <div className="space-y-3 border-b border-border pb-6">
                <h3 className="font-semibold text-foreground text-sm">Tax Breakdown (CGST/SGST/IGST)</h3>
                <div className="bg-muted/30 p-3 rounded space-y-2">
                  <div className="flex gap-2 items-center">
                    <label className="text-xs font-medium text-muted-foreground w-12">CGST</label>
                    <input
                      type="number"
                      value={selectedTransactionForDrawer.cgstAmount || 0}
                      onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, cgstAmount: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs"
                    />
                    <span className="text-xs text-muted-foreground">₹</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-xs font-medium text-muted-foreground w-12">SGST</label>
                    <input
                      type="number"
                      value={selectedTransactionForDrawer.sgstAmount || 0}
                      onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, sgstAmount: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs"
                    />
                    <span className="text-xs text-muted-foreground">₹</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-xs font-medium text-muted-foreground w-12">IGST</label>
                    <input
                      type="number"
                      value={selectedTransactionForDrawer.igstAmount || 0}
                      onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, igstAmount: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs"
                    />
                    <span className="text-xs text-muted-foreground">₹</span>
                  </div>
                </div>
              </div>

              {/* Payment & Reconciliation */}
              <div className="space-y-3 border-b border-border pb-6">
                <h3 className="font-semibold text-foreground text-sm">Payment & Reconciliation</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Payment Status</label>
                  <select
                    value={selectedTransactionForDrawer.paymentStatus || 'Recorded'}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    {paymentStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Reconciliation Status</label>
                  <select
                    value={selectedTransactionForDrawer.reconciliationStatus || 'Unreconciled'}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, reconciliationStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    {reconciliationStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Payment Method</label>
                  <select
                    value={selectedTransactionForDrawer.paymentMethod || 'Wire Transfer'}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    {paymentMethodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Bank Statement Ref</label>
                  <input
                    type="text"
                    value={selectedTransactionForDrawer.bankStatementReference || ''}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, bankStatementReference: e.target.value })}
                    placeholder="e.g., TXN-001"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                </div>
              </div>

              {/* Vendor/Customer Info */}
              <div className="space-y-3 border-b border-border pb-6">
                <h3 className="font-semibold text-foreground text-sm">Vendor/Customer</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Name</label>
                  <input
                    type="text"
                    value={selectedTransactionForDrawer.vendorCustomerName || ''}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, vendorCustomerName: e.target.value })}
                    placeholder="Vendor or customer name"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Bill Reference</label>
                  <input
                    type="text"
                    value={selectedTransactionForDrawer.billReferenceNumber || ''}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, billReferenceNumber: e.target.value })}
                    placeholder="Supplier bill number"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                </div>
              </div>

              {/* Allocation & Routing */}
              <div className="space-y-3 border-b border-border pb-6">
                <h3 className="font-semibold text-foreground text-sm">Allocation & Routing</h3>
                
                {/* Bucket Cards */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">Select Bucket</label>
                  {buckets.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                    {buckets.map(bucket => {
                      const allocated = calculateBucketAllocation(bucket.id);
                      const capacity = bucket.monthlyTarget || Math.max(bucket.currentBalance, allocated, 1);
                      const percentage = Math.min((allocated / capacity) * 100, 100);
                      const { status, color, label } = getBucketStatus(allocated, capacity);
                      const isSelected = selectedTransactionForDrawer.bucketId === bucket.id;
                      
                      return (
                        <button
                          key={bucket.id}
                          onClick={() => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, bucketId: bucket.id })}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          {/* Bucket Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm text-foreground">{bucket.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{bucket.type} bucket</p>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Allocation Info */}
                          <div className="text-xs text-muted-foreground mb-2">
                            <p>₹{allocated.toLocaleString('en-IN')} / ₹{capacity.toLocaleString('en-IN')}</p>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                            <div 
                              className={`h-full rounded-full transition-all ${color}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          {/* Status Badge */}
                          <div className={`text-xs font-medium px-2 py-0.5 rounded inline-block ${
                            status === 'healthy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {label}
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                      No buckets available. Create a bucket to route this transaction.
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Bank Account</label>
                  <select
                    value={selectedTransactionForDrawer.assignedBankAccountId || ''}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, assignedBankAccountId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    <option value="">Select Account</option>
                    {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.label} (₹{acc.balance.toLocaleString('en-IN')})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Cost Center</label>
                  <select
                    value={selectedTransactionForDrawer.costCenter || ''}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, costCenter: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    <option value="">Select Cost Center</option>
                    {costCenterOptions.map(cc => <option key={cc.id} value={cc.id}>{cc.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Approval */}
              <div className="space-y-3 border-b border-border pb-6">
                <h3 className="font-semibold text-foreground text-sm">Approval</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Approval Status</label>
                  <select
                    value={selectedTransactionForDrawer.approvalStatus || 'Pending Approval'}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, approvalStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  >
                    {approvalStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Approved By</label>
                  <input
                    type="text"
                    value={selectedTransactionForDrawer.approvedBy || ''}
                    onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, approvedBy: e.target.value })}
                    placeholder="Approver name"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3 border-b border-border pb-6">
                <h3 className="font-semibold text-foreground text-sm">Notes & Comments</h3>
                <textarea
                  value={selectedTransactionForDrawer.notes || ''}
                  onChange={(e) => setSelectedTransactionForDrawer({ ...selectedTransactionForDrawer, notes: e.target.value })}
                  placeholder="Add notes about this transaction..."
                  className="w-full px-3 py-2 bg-background border border-border rounded text-sm min-h-20 resize-none"
                />
              </div>

              {/* Save and Cancel Buttons */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-background border-t border-border">
                <button
                  onClick={async () => {
                    setTransactions(transactions.map(t => 
                      t.id === selectedTransactionForDrawer.id 
                        ? selectedTransactionForDrawer 
                        : t
                    ));

                    try {
                      const persistedTransaction = await persistTransaction(
                        selectedTransactionForDrawer,
                        selectedTransactionForDrawer.id
                      );
                      if (persistedTransaction) {
                        setTransactions((prev) =>
                          prev.map((t) => (t.id === selectedTransactionForDrawer.id ? persistedTransaction : t))
                        );
                      }
                      notifyTransactionsUpdated();
                    } catch (err: any) {
                      setError(err?.message ?? 'Failed to save transaction.');
                    }

                    setDrawerOpen(false);
                    setSelectedTransactionForDrawer(null);
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setSelectedTransactionForDrawer(null);
                  }}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
