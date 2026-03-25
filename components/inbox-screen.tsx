'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, X, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangeFilter, type DateRange } from './date-range-filter';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  isIncome: boolean;
  accountingType: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  subtype: string;
  invoice?: string;
  matchedInvoiceId?: string; // ID from Invoices screen
  adjustment: 'Full' | 'Partial';
  gstSplit: { taxable: number; gst: number };
  notes: string;
  status: 'Recorded' | 'Needs Info' | 'Action Required';
  allocationStatus: 'Allocated' | 'Partially Allocated' | 'Unallocated';
}

interface Invoice {
  id: string;
  number: string;
  partyName: string;
  pendingAmount: number;
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
  Revenue: ['Sales', 'Service Income', 'Investment Returns', 'Other Income'],
  Expense: ['Operating', 'COGS', 'Travel', 'Utilities', 'Salaries', 'Other'],
  Asset: ['Cash', 'Inventory', 'Equipment', 'Other'],
  Liability: ['Accounts Payable', 'Loans', 'GST Payable', 'Other'],
};

interface InboxScreenProps {
  onNavigate?: (nav: string) => void;
}

export function InboxScreen({ onNavigate }: InboxScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  const saveTransaction = () => {
    if (editingRowId && editFormData) {
      // Track the last used type for next transaction
      setLastUsedType(editFormData.accountingType || 'Revenue');
      setTransactions(transactions.map(t => (t.id === editingRowId ? { ...t, ...editFormData } : t)));
      setEditingRowId(null);
      setEditFormData(null);
      setOpenDropdown(null);
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

  // Auto-focus description field when entering edit mode
  useEffect(() => {
    if (editingRowId && descriptionInputRef.current) {
      setTimeout(() => descriptionInputRef.current?.focus(), 0);
    }
  }, [editingRowId]);

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    if (editingRowId === id) {
      cancelEditMode();
    }
    setDeleteConfirmId(null);
    setOpenMoreMenuId(null);
    setDeleteProtectPassword('');
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
            onClick={addNewTransaction}
            disabled={editingRowId !== null}
            className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add Transaction_test
          </Button>
        </div>
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
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <div className="inline-block w-full min-w-full">
          {/* Column Headers */}
          <div className="sticky top-0 bg-background border-b border-border">
            <div className="flex h-9 items-center gap-0.5 px-8">
              <div className="w-16 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</div>
              <div className="flex-1 min-w-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</div>
              <div className="w-32 flex-shrink-0 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</div>
              <div className="w-28 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</div>
              <div className="w-28 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtype</div>
              <div className="w-28 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice</div>
              <div className="w-20 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adjust</div>
              <div className="w-20 flex-shrink-0 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST</div>
              <div className="w-32 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</div>
              <div className="w-40 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allocation Status</div>
              <div className="w-32 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matched Invoice</div>
              <div className="w-28 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</div>
              <div className="w-16 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</div>
            </div>
          </div>

          {/* Transaction Rows */}
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className={`flex h-9 items-center gap-0.5 px-8 border-b border-border transition-colors ${
                isEditing(txn.id)
                  ? 'bg-primary/5'
                  : 'hover:bg-muted/20'
              }`}
              onMouseEnter={() => !editingRowId && setHoverRowId(txn.id)}
              onMouseLeave={() => setHoverRowId(null)}
            >
              {isEditing(txn.id) && editFormData ? (
                <>
                  {/* Date */}
                  <div className="w-16 flex-shrink-0 cell-shell">
                    <input
                      type="text"
                      value={editFormData.date || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      className="cell-input"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0 cell-shell">
                    <input
                      ref={descriptionInputRef}
                      type="text"
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="cell-input"
                    />
                  </div>

                  {/* Amount */}
                  <div className="w-32 flex-shrink-0 cell-shell justify-end">
                    <input
                      type="number"
                      value={editFormData.amount || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) || 0 })}
                      className="cell-input text-right"
                    />
                  </div>

                  {/* Type */}
                  <div className="w-28 flex-shrink-0">
                    <CompactDropdown
                      value={editFormData.accountingType || 'Revenue'}
                      onChange={(val) => setEditFormData({ ...editFormData, accountingType: val as any, subtype: subtypeOptions[val]?.[0] || '' })}
                      options={['Revenue', 'Expense', 'Asset', 'Liability']}
                      txnId={txn.id}
                      field="type"
                    />
                  </div>

                  {/* Subtype */}
                  <div className="w-28 flex-shrink-0">
                    <CompactDropdown
                      value={editFormData.subtype || ''}
                      onChange={(val) => setEditFormData({ ...editFormData, subtype: val })}
                      options={subtypeOptions[editFormData.accountingType || 'Revenue'] || []}
                      txnId={txn.id}
                      field="subtype"
                    />
                  </div>

                  {/* Invoice */}
                  <div className="w-28 flex-shrink-0">
                    <CompactDropdown
                      value={editFormData.invoice || 'None'}
                      onChange={(val) => setEditFormData({ ...editFormData, invoice: val === 'None' ? '' : val })}
                      options={['None', ...(sampleInvoices[editFormData.accountingType || 'Revenue']?.map((inv) => inv.number) || [])]}
                      txnId={txn.id}
                      field="invoice"
                    />
                  </div>

                  {/* Adjustment */}
                  <div className="w-20 flex-shrink-0">
                    <CompactDropdown
                      value={editFormData.adjustment || 'Full'}
                      onChange={(val) => setEditFormData({ ...editFormData, adjustment: val as any })}
                      options={['Full', 'Partial']}
                      txnId={txn.id}
                      field="adjustment"
                    />
                  </div>

                  {/* GST - Read-only */}
                  <div className="w-20 flex-shrink-0 cell-shell justify-end">
                    <div className="text-right text-xs text-muted-foreground truncate">
                      {editFormData.gstSplit?.gst > 0 ? `₹${editFormData.gstSplit.gst}` : '—'}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="w-32 flex-shrink-0 cell-shell">
                    <input
                      type="text"
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="cell-input"
                      placeholder="Note"
                    />
                  </div>

                  {/* Allocation Status - Read-only placeholder */}
                  <div className="w-40 flex-shrink-0 cell-shell">
                    <div className="text-xs text-muted-foreground">
                      —
                    </div>
                  </div>

                  {/* Matched Invoice - Read-only placeholder */}
                  <div className="w-32 flex-shrink-0 cell-shell">
                    <div className="text-xs text-muted-foreground">
                      —
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-28 flex-shrink-0 cell-shell">
                    <CompactDropdown
                      value={editFormData.status || 'Recorded'}
                      onChange={(val) => setEditFormData({ ...editFormData, status: val as any })}
                      options={['Recorded', 'Needs Info', 'Action Required']}
                      txnId={txn.id}
                      field="status"
                    />
                  </div>

                  {/* Actions - Save/Cancel */}
                  <div className="w-16 flex-shrink-0 flex items-center justify-end gap-1">
                    <button
                      onClick={saveTransaction}
                      className="p-1 text-accent hover:text-accent/70 transition-colors"
                      title="Save"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.5 2.5L6 10L2.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      onClick={cancelEditMode}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Date */}
                  <div className="w-16 flex-shrink-0 cell-shell"><div className="text-xs text-muted-foreground truncate">{txn.date}</div></div>

                  {/* Description */}
                  <div className="flex-1 min-w-0 cell-shell"><div className="text-xs text-foreground truncate">{txn.description}</div></div>

                  {/* Amount */}
                  <div className="w-32 flex-shrink-0 cell-shell justify-end">
                    <div className="text-right text-xs font-medium">
                      <span className={txn.isIncome ? 'text-accent' : 'text-destructive'}>
                        {txn.isIncome ? '+' : '−'}₹{txn.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="w-28 flex-shrink-0 cell-shell"><div className="text-xs text-muted-foreground truncate">{txn.accountingType}</div></div>

                  {/* Subtype */}
                  <div className="w-28 flex-shrink-0 cell-shell"><div className="text-xs text-muted-foreground truncate">{txn.subtype}</div></div>

                  {/* Invoice */}
                  <div className="w-28 flex-shrink-0 cell-shell"><div className="text-xs text-muted-foreground truncate">{txn.invoice || '—'}</div></div>

                  {/* Adjustment */}
                  <div className="w-20 flex-shrink-0 cell-shell"><div className="text-xs text-muted-foreground truncate">{txn.adjustment}</div></div>

                  {/* GST */}
                  <div className="w-20 flex-shrink-0 cell-shell justify-end">
                    <div className="text-right text-xs text-muted-foreground truncate">
                      {txn.gstSplit?.gst > 0 ? `₹${txn.gstSplit.gst}` : '—'}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="w-32 flex-shrink-0 cell-shell"><div className="text-xs text-muted-foreground truncate italic">{txn.notes || '—'}</div></div>

                  {/* Allocation Status */}
                  <div className="w-40 flex-shrink-0 cell-shell">
                    <div className="relative group flex-1">
                      <div className="text-xs text-foreground truncate">
                        {txn.allocationStatus}
                      </div>
                      <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded shadow-lg z-50 p-2 min-w-48 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity whitespace-normal">
                        <p className="text-xs text-muted-foreground">
                          Allocation is managed from Buckets
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Matched Invoice */}
                  <div className="w-32 flex-shrink-0 cell-shell">
                    {txn.matchedInvoiceId ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                        <span className="text-xs font-medium text-accent truncate">
                          {txn.invoice || 'Matched'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="w-28 flex-shrink-0 cell-shell">
                    <div className={`text-xs font-medium truncate px-2 py-1 rounded ${getStatusColor(txn.status)}`}>
                      {txn.status}
                    </div>
                  </div>

                  {/* Actions - More menu only on hover */}
                  <div className="w-16 flex-shrink-0 flex items-center justify-end gap-1">
                    {hoverRowId === txn.id ? (
                      <>
                        <button
                          onClick={() => startEditMode(txn)}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMoreMenuId(openMoreMenuId === txn.id ? null : txn.id)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="More options"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openMoreMenuId === txn.id && (
                            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded shadow-lg z-50 min-w-48">
                              <button
                                onClick={() => {
                                  startEditMode(txn);
                                  setOpenMoreMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-foreground hover:bg-muted transition-colors border-b border-border"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmId(txn.id);
                                  setOpenMoreMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                Delete Transaction
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => setHoverRowId(txn.id)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="More options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
