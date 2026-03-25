'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrganization } from '@/context/organization-context';

interface InvoicesScreenProps {
  onNavigate?: (nav: string) => void;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  partyName: string;
  partyGSTNo: string;
  billingAddress: string;
  shippingAddress: string;
  type: 'Revenue' | 'Expense';
  invoiceAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  servicesProvided?: string;
  paymentType?: 'Full' | 'Advance' | 'Installment';
  advancePayment?: number;
  invoiceDate?: string;
  companyGSTNo?: string;
}

type InvoiceRow = {
  id: string;
  invoice_no?: string | null;
  invoiceNo?: string | null;
  party_name?: string | null;
  partyName?: string | null;
  type?: 'Revenue' | 'Expense' | null;
  invoice_amount?: number | null;
  invoiceAmount?: number | null;
  paid_amount?: number | null;
  paidAmount?: number | null;
  balance_due?: number | null;
  balanceDue?: number | null;
  due_date?: string | null;
  dueDate?: string | null;
  status?: Invoice['status'] | null;
};

interface Payment {
  date: string;
  description: string;
  amountApplied: number;
  sourceAccount: string;
  type: 'Full' | 'Partial';
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  isIncome: boolean;
}

interface MatchedTransaction {
  bankTxnId: string;
  appliedAmount: number;
  applicationType: 'full' | 'partial';
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'text-accent';
    case 'Partial':
      return 'text-warning';
    case 'Overdue':
      return 'text-destructive';
    case 'Unpaid':
    default:
      return 'text-muted-foreground';
  }
};

const mapInvoiceRow = (row: InvoiceRow): Invoice => {
  const invoiceAmount = row.invoice_amount ?? row.invoiceAmount ?? 0;
  const paidAmount = row.paid_amount ?? row.paidAmount ?? 0;
  const balanceDue = row.balance_due ?? row.balanceDue ?? Math.max(0, invoiceAmount - paidAmount);

  return {
    id: row.id,
    invoiceNo: row.invoice_no ?? row.invoiceNo ?? '',
    partyName: row.party_name ?? row.partyName ?? '',
    partyGSTNo: '',
    billingAddress: '',
    shippingAddress: '',
    type: (row.type ?? 'Revenue') as Invoice['type'],
    invoiceAmount,
    paidAmount,
    balanceDue,
    dueDate: row.due_date ?? row.dueDate ?? '',
    status: (row.status ?? 'Unpaid') as Invoice['status'],
  };
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

export function InvoicesScreen({ onNavigate }: InvoicesScreenProps) {
  const { currentOrganization } = useOrganization();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showMatchingPanel, setShowMatchingPanel] = useState<boolean>(false);
  const [matchedTransactions, setMatchedTransactions] = useState<MatchedTransaction[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [effectiveOrganizationId, setEffectiveOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    invoiceNo: '',
    partyName: '',
    partyGSTNo: '',
    billingAddress: '',
    shippingAddress: '',
    companyGSTNo: '18ABCDE1234F1Z0',
    type: 'Revenue' as 'Revenue' | 'Expense',
    invoiceAmount: '',
    dueDate: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    servicesProvided: '',
    paymentType: 'Full' as 'Full' | 'Advance' | 'Installment',
    advancePayment: '',
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);

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

  const fetchInvoices = useCallback(async () => {
    if (!effectiveOrganizationId) {
      setInvoices([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const query = new URLSearchParams({
        userId: currentUserId ?? '',
        organizationId: effectiveOrganizationId,
      });
      const response = await fetch(`/api/invoices?${query.toString()}`, {
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
        throw new Error(result?.error ?? 'Failed to load invoices.');
      }

      setInvoices(((result.invoices ?? []) as InvoiceRow[]).map(mapInvoiceRow));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, effectiveOrganizationId]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  const selectedInvoice = selectedInvoiceId
    ? invoices.find((inv) => inv.id === selectedInvoiceId)
    : null;

  const getNextInvoiceNumber = (type: 'Revenue' | 'Expense') => {
    const prefix = type === 'Revenue' ? 'INV' : 'BILL';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sameTypeInvoices = invoices.filter((inv) => inv.type === type && inv.invoiceNo.startsWith(prefix));
    const nextNumber = sameTypeInvoices.length + 1;
    return `${prefix}-${year}${month}-${String(nextNumber).padStart(3, '0')}`;
  };

  const handleOpenCreateModal = () => {
    setFormData((prev) => ({
      ...prev,
      invoiceNo: getNextInvoiceNumber(prev.type),
    }));
    setShowCreateModal(true);
  };

  // Create new invoice with all fields
  const handleCreateInvoice = async () => {
    if (!formData.invoiceNo || !formData.partyName || !formData.invoiceAmount || !formData.dueDate) {
      return;
    }

    setCreateLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'x-access-token': accessToken,
          'x-user-id': currentUserId ?? '',
          'x-organization-id': effectiveOrganizationId ?? '',
        },
        body: JSON.stringify({
          accessToken,
          userId: currentUserId,
          organizationId: effectiveOrganizationId,
          invoiceNo: formData.invoiceNo,
          partyName: formData.partyName,
          type: formData.type,
          invoiceAmount: Number.parseFloat(formData.invoiceAmount),
          paidAmount: 0,
          balanceDue: Number.parseFloat(formData.invoiceAmount),
          dueDate: formData.dueDate,
          status: 'Unpaid',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to create invoice.');
      }

      const newInvoice = mapInvoiceRow(result.invoice as InvoiceRow);
      setInvoices((prev) => [...prev, newInvoice]);
      setFormData({
        invoiceNo: '',
        partyName: '',
        partyGSTNo: '',
        billingAddress: '',
        shippingAddress: '',
        companyGSTNo: '18ABCDE1234F1Z0',
        type: 'Revenue',
        invoiceAmount: '',
        dueDate: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        servicesProvided: '',
        paymentType: 'Full',
        advancePayment: '',
      });
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create invoice.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Function to save matched transactions
  const saveMatchedTransactions = () => {
    if (!selectedInvoice) return;
    
    const totalMatched = matchedTransactions.reduce((sum, m) => sum + m.appliedAmount, 0);
    const newPaidAmount = selectedInvoice.paidAmount + totalMatched;
    const newBalanceDue = Math.max(0, selectedInvoice.invoiceAmount - newPaidAmount);
    
    let newStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' = 'Unpaid';
    if (newBalanceDue === 0) newStatus = 'Paid';
    else if (newPaidAmount > 0) newStatus = 'Partial';
    
    setInvoices(
      invoices.map((inv) =>
        inv.id === selectedInvoiceId
          ? {
              ...inv,
              paidAmount: newPaidAmount,
              balanceDue: newBalanceDue,
              status: newStatus,
            }
          : inv
      )
    );
    
    // Clear matched transactions and close panel
    setMatchedTransactions([]);
    setShowMatchingPanel(false);
  };

  // Sample bank transactions from Inbox
  const inboxTransactions: BankTransaction[] = [];

  // Calculate totals for live update
  const totalMatched = matchedTransactions.reduce((sum, m) => sum + m.appliedAmount, 0);
  const totalPaid = selectedInvoice ? selectedInvoice.paidAmount + totalMatched : 0;
  const remainingBalance = selectedInvoice ? selectedInvoice.invoiceAmount - totalPaid : 0;

  // Sample payments data for the selected invoice
  const payments: Payment[] = [];

  if (selectedInvoice) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <div className="pt-8 pb-4 px-6 border-b border-border flex items-center gap-3">
          <button
            onClick={() => setSelectedInvoiceId(null)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-medium">Invoice {selectedInvoice.invoiceNo}</h1>
        </div>

        {/* Two-Column Layout */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-8 p-8">
            {/* LEFT: Invoice Summary */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Invoice Number
                </p>
                <p className="text-lg font-medium text-foreground">{selectedInvoice.invoiceNo}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Party Name
                </p>
                <p className="text-sm text-foreground">{selectedInvoice.partyName}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Invoice Type
                </p>
                <p className="text-sm text-foreground">{selectedInvoice.type}</p>
              </div>

              <div className="pt-4 border-t border-border space-y-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Invoice Amount
                  </p>
                  <p className="text-2xl font-medium text-primary">₹{selectedInvoice.invoiceAmount.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Paid Amount
                  </p>
                  <p className="text-sm font-medium text-accent">₹{selectedInvoice.paidAmount.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Balance Due
                  </p>
                  <p className={`text-sm font-medium ${selectedInvoice.balanceDue > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    ₹{selectedInvoice.balanceDue.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Due Date
                  </p>
                  <p className="text-sm text-foreground">{selectedInvoice.dueDate}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Status
                  </p>
                  <p className={`text-sm font-medium ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: Payments Linked */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Payments Linked</h2>
                <button 
                  onClick={() => setShowMatchingPanel(!showMatchingPanel)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus size={14} />
                  Match Payment
                </button>
              </div>

              {/* Payments Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                {payments.length > 0 ? (
                  <div className="divide-y divide-border">
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <div>Date</div>
                      <div>Description</div>
                      <div className="text-right">Amount Applied</div>
                      <div className="text-right">Type</div>
                    </div>

                    {/* Rows */}
                    {payments.map((payment, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-4 px-4 py-3 items-center hover:bg-muted/20 transition-colors">
                        <div className="text-xs text-foreground">{payment.date}</div>
                        <div className="text-xs text-foreground">{payment.description}</div>
                        <div className="text-xs font-medium text-foreground text-right">₹{payment.amountApplied.toLocaleString()}</div>
                        <div className="text-xs text-right">
                          <span className={`px-2 py-1 rounded ${payment.type === 'Full' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}`}>
                            {payment.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-xs text-muted-foreground">No payments linked yet</p>
                    <button className="mt-3 text-xs text-primary hover:underline">Link a payment →</button>
                  </div>
                )}
              </div>

              {/* Inline Matching Panel */}
              {showMatchingPanel && (
                <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/5">
                  {/* Live Balance Display */}
                  <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Invoice Amount</p>
                      <p className="text-sm font-semibold text-foreground">₹{selectedInvoice.invoiceAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Paid</p>
                      <p className="text-sm font-semibold text-accent">₹{totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Balance Remaining</p>
                      <p className={`text-sm font-semibold ${remainingBalance > 0 ? 'text-destructive' : 'text-accent'}`}>
                        ₹{Math.max(0, remainingBalance).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Available Transactions List */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Bank Transactions</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {inboxTransactions.map((txn) => {
                        const isMatched = matchedTransactions.some((m) => m.bankTxnId === txn.id);
                        const matchData = matchedTransactions.find((m) => m.bankTxnId === txn.id);
                        const isDisabled = !isMatched && totalMatched + txn.amount > selectedInvoice.invoiceAmount - selectedInvoice.paidAmount;

                        return (
                          <div key={txn.id} className="border border-border rounded p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{txn.description}</p>
                                <p className="text-xs text-muted-foreground">{txn.date}</p>
                              </div>
                              <p className="text-xs font-semibold text-foreground whitespace-nowrap">₹{txn.amount.toLocaleString()}</p>
                            </div>

                            {/* Match Controls */}
                            {isMatched ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const updated = matchedTransactions.map((m) =>
                                        m.bankTxnId === txn.id
                                          ? { ...m, applicationType: 'full' as const, appliedAmount: txn.amount }
                                          : m
                                      );
                                      setMatchedTransactions(updated);
                                    }}
                                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      matchData?.applicationType === 'full'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                    }`}
                                  >
                                    Full
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updated = matchedTransactions.map((m) =>
                                        m.bankTxnId === txn.id ? { ...m, applicationType: 'partial' as const } : m
                                      );
                                      setMatchedTransactions(updated);
                                    }}
                                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      matchData?.applicationType === 'partial'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                    }`}
                                  >
                                    Partial
                                  </button>
                                </div>

                                {/* Partial Amount Input */}
                                {matchData?.applicationType === 'partial' && (
                                  <input
                                    type="number"
                                    value={matchData.appliedAmount}
                                    onChange={(e) => {
                                      const newAmount = Math.min(Math.max(0, Number(e.target.value)), txn.amount, remainingBalance + matchData.appliedAmount);
                                      const updated = matchedTransactions.map((m) =>
                                        m.bankTxnId === txn.id ? { ...m, appliedAmount: newAmount } : m
                                      );
                                      setMatchedTransactions(updated);
                                    }}
                                    className="w-full px-2 py-1 text-xs border border-border rounded bg-input"
                                    placeholder="Enter amount"
                                    max={txn.amount}
                                  />
                                )}

                                <button
                                  onClick={() => setMatchedTransactions(matchedTransactions.filter((m) => m.bankTxnId !== txn.id))}
                                  className="w-full text-xs px-2 py-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setMatchedTransactions([
                                    ...matchedTransactions,
                                    { bankTxnId: txn.id, appliedAmount: txn.amount, applicationType: 'full' },
                                  ]);
                                }}
                                disabled={isDisabled}
                                className="w-full text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                              >
                                Match
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Matches Button */}
                  <div className="pt-4 border-t border-border flex gap-2">
                    <button
                      onClick={saveMatchedTransactions}
                      disabled={matchedTransactions.length === 0}
                      className="flex-1 px-3 py-2 bg-accent text-accent-foreground rounded text-xs font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Confirm Matches
                    </button>
                    <button
                      onClick={() => {
                        setMatchedTransactions([]);
                        setShowMatchingPanel(false);
                      }}
                      className="flex-1 px-3 py-2 bg-muted text-muted-foreground rounded text-xs font-medium hover:bg-muted/70 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Source Account Info */}
              {payments.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Source Account
                  </p>
                  <p className="text-sm text-foreground">{payments[0].sourceAccount}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 px-6 border-b border-border flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Track all issued and received invoices</p>
        <Button 
          onClick={handleOpenCreateModal}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={16} />
          Create Invoice
        </Button>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-0 border-b border-border">
          {/* Header Row */}
          <div className="sticky top-0 px-6 py-3 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="w-24 flex-shrink-0">Invoice No</div>
              <div className="w-32 flex-shrink-0">Party Name</div>
              <div className="w-20 flex-shrink-0">Type</div>
              <div className="w-24 flex-shrink-0 text-right">Amount</div>
              <div className="w-24 flex-shrink-0 text-right">Paid</div>
              <div className="w-24 flex-shrink-0 text-right">Balance</div>
              <div className="w-28 flex-shrink-0">Due Date</div>
              <div className="w-20 flex-shrink-0">Status</div>
              <div className="w-12 flex-shrink-0"></div>
            </div>
          </div>

          {loading && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading invoices...</div>
          )}

          {!loading && invoices.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">No invoices yet. Create your first invoice.</div>
          )}

          {/* Data Rows */}
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="px-6 py-3 flex items-center gap-3 border-b border-border hover:bg-muted/20 transition-colors cursor-pointer group"
            >
              <div className="w-24 flex-shrink-0">
                <p className="text-sm font-medium text-foreground">{invoice.invoiceNo}</p>
              </div>
              <div className="w-32 flex-shrink-0">
                <p className="text-sm text-foreground truncate">{invoice.partyName}</p>
              </div>
              <div className="w-20 flex-shrink-0">
                <p className="text-xs text-muted-foreground font-medium">{invoice.type}</p>
              </div>
              <div className="w-24 flex-shrink-0 text-right">
                <p className="text-sm font-medium text-foreground">₹{invoice.invoiceAmount.toLocaleString()}</p>
              </div>
              <div className="w-24 flex-shrink-0 text-right">
                <p className="text-sm text-muted-foreground">₹{invoice.paidAmount.toLocaleString()}</p>
              </div>
              <div className="w-24 flex-shrink-0 text-right">
                <p className={`text-sm font-medium ${invoice.balanceDue > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  ₹{invoice.balanceDue.toLocaleString()}
                </p>
              </div>
              <div className="w-28 flex-shrink-0">
                <p className="text-sm text-muted-foreground">{invoice.dueDate}</p>
              </div>
              <div className="w-20 flex-shrink-0">
                <p className={`text-xs font-medium ${getStatusColor(invoice.status)}`}>{invoice.status}</p>
              </div>
              <div className="w-12 flex-shrink-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setSelectedInvoiceId(invoice.id)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Invoice Modal - Comprehensive Form */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-4xl p-8 space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Create New Invoice</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form Sections */}
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Invoice Number</label>
                    <input
                      type="text"
                      value={formData.invoiceNo}
                      disabled
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm font-medium text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-generated</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Invoice Date</label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value as 'Revenue' | 'Expense';
                        const nextInvoiceNo = getNextInvoiceNumber(newType);
                        setFormData({
                          ...formData,
                          type: newType,
                          invoiceNo: nextInvoiceNo,
                        });
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    >
                      <option value="Revenue">Revenue (Invoice)</option>
                      <option value="Expense">Expense (Bill)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Party Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Party Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Party Name *</label>
                    <input
                      type="text"
                      value={formData.partyName}
                      onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                      placeholder="Enter party name"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Party GST Number</label>
                    <input
                      type="text"
                      value={formData.partyGSTNo}
                      onChange={(e) => setFormData({ ...formData, partyGSTNo: e.target.value })}
                      placeholder="18AABCT1234H1Z0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Billing Address</label>
                    <textarea
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      placeholder="Enter complete billing address"
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Shipping Address</label>
                    <textarea
                      value={formData.shippingAddress}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                      placeholder="Enter complete shipping address (leave blank if same as billing)"
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Company Information</h3>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Company GST Number</label>
                  <input
                    type="text"
                    value={formData.companyGSTNo}
                    onChange={(e) => setFormData({ ...formData, companyGSTNo: e.target.value })}
                    placeholder="18ABCDE1234F1Z0"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Section 4: Services & Amount */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Services & Amount</h3>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Services Provided / Description *</label>
                  <textarea
                    value={formData.servicesProvided}
                    onChange={(e) => setFormData({ ...formData, servicesProvided: e.target.value })}
                    placeholder="Describe services or items provided"
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Invoice Amount *</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-muted text-muted-foreground rounded-l-lg">₹</span>
                      <input
                        type="number"
                        value={formData.invoiceAmount}
                        onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })}
                        placeholder="0"
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-r-lg text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Due Date *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Payment Terms */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Payment Terms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Payment Type</label>
                    <select
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as 'Full' | 'Advance' | 'Installment' })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    >
                      <option value="Full">Full Payment</option>
                      <option value="Advance">Advance Payment</option>
                      <option value="Installment">Installment</option>
                    </select>
                  </div>
                  {formData.paymentType === 'Advance' && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Advance Amount</label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-muted text-muted-foreground rounded-l-lg">₹</span>
                        <input
                          type="number"
                          value={formData.advancePayment}
                          onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                          placeholder="0"
                          className="flex-1 px-3 py-2 bg-background border border-border rounded-r-lg text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t border-border">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleCreateInvoice}
                disabled={createLoading || !formData.invoiceNo || !formData.partyName || !formData.invoiceAmount || !formData.dueDate}
                className="flex-1"
              >
                {createLoading ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
