'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, AlertCircle, Plus, X, Calendar, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/lib/supabase/client';

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

interface Obligation {
  id: string;
  type: 'Salary' | 'Vendor Invoice' | 'Loan EMI' | 'Advance' | 'Partner Payout';
  party: string;
  category: 'Employee' | 'Vendor' | 'Loan' | 'Owner';
  amountDue: number;
  dueDate: string;
  status: 'Planned' | 'Due Soon' | 'Overdue';
  source: 'Auto' | 'Manual';
  sourceRef?: string;
}

interface Loan {
  id: string;
  lender: string;
  loanType: 'Bank Loan' | 'Line of Credit' | 'Equipment Finance';
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  emiAmount: number;
  nextEmiDate: string;
  totalEmi: number;
  completedEmi: number;
}

interface CreditCard {
  id: string;
  cardName: string;
  bank: string;
  lastFourDigits: string;
  creditLimit: number;
  currentBalance: number;
  minimumPaymentDue: number;
  dueDate: string;
  interestRate: number;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Planned':
      return { bg: 'bg-info-bg', text: 'text-info', label: 'Planned' };
    case 'Due Soon':
      return { bg: 'bg-warning-bg', text: 'text-warning', label: 'Due Soon' };
    case 'Overdue':
      return { bg: 'bg-error-bg', text: 'text-error', label: 'Overdue' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground', label: status };
  }
};

const calculateStatus = (dueDate: string): 'Planned' | 'Due Soon' | 'Overdue' => {
  const today = new Date();
  const due = new Date(dueDate);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) return 'Overdue';
  if (daysUntilDue <= 3) return 'Due Soon';
  return 'Planned';
};

export function ObligationsScreen() {
  // Auto-obligations loaded from API (invoices + transactions)
  const [autoObligations, setAutoObligations] = useState<Obligation[]>([]);
  // User-added obligations (manual entry)
  const [manualObligations, setManualObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loans] = useState<Loan[]>([]);
  const [creditCards] = useState<CreditCard[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<Obligation | null>(null);
  const [newObligation, setNewObligation] = useState({
    type: 'Vendor Invoice' as const,
    party: '',
    amountDue: '',
    dueDate: '',
    category: 'Vendor' as const,
  });

  // Combined view — auto obligations first, then manual
  const obligations = [...autoObligations, ...manualObligations];

  useEffect(() => {
    fetchObligations();
  }, []);

  const fetchObligations = async () => {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();
      const headers: HeadersInit = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {};

      const [invoicesRes, transactionsRes, manualRes] = await Promise.all([
        fetch('/api/invoices', { headers, cache: 'no-store' }),
        fetch('/api/transactions', { headers, cache: 'no-store' }),
        fetch('/api/obligations', { headers, cache: 'no-store' }),
      ]);

      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : { invoices: [] };
      const txData = transactionsRes.ok ? await transactionsRes.json() : { transactions: [] };
      const manualData = manualRes.ok ? await manualRes.json() : { obligations: [] };

      const invoices: any[] = invoicesData.invoices ?? [];
      const transactions: any[] = txData.transactions ?? [];
      const dbManual: any[] = manualData.obligations ?? [];

      const built: Obligation[] = [];

      // Vendor obligations — unpaid/partial expense invoices
      for (const inv of invoices) {
        const invType: string = inv.type ?? inv.Type ?? '';
        const invStatus: string = inv.status ?? inv.Status ?? 'Unpaid';
        if (invType === 'Expense' && invStatus !== 'Paid') {
          const invoiceAmount = Number(inv.invoice_amount ?? inv.invoiceamount ?? inv.invoiceAmount ?? 0);
          const paidAmount = Number(inv.paid_amount ?? inv.paidamount ?? inv.paidAmount ?? 0);
          const balanceDue = invoiceAmount - paidAmount;
          if (balanceDue <= 0) continue;
          const dueDate: string =
            inv.due_date ?? inv.dueDate ?? inv.duedate ?? new Date().toISOString().slice(0, 10);
          const partyName: string =
            inv.party_name ?? inv.partyname ?? inv.partyName ?? 'Unknown Vendor';
          built.push({
            id: `inv-${inv.id ?? Math.random()}`,
            type: 'Vendor Invoice',
            party: partyName,
            category: 'Vendor',
            amountDue: balanceDue,
            dueDate,
            status: calculateStatus(dueDate),
            source: 'Auto',
            sourceRef: inv.invoice_no ?? inv.invoiceno ?? inv.invoiceNo ?? '',
          });
        }
      }

      // Employee & Loan obligations — from expense/liability transactions
      for (const tx of transactions) {
        const isIncome: boolean = tx.is_income ?? tx.isIncome ?? false;
        const subtype: string = tx.subtype ?? '';
        const accountingType: string = tx.accounting_type ?? tx.accountingType ?? '';
        const amount = Math.abs(Number(tx.amount ?? 0));
        if (amount === 0 || isIncome) continue;

        const txDate: string = tx.date ?? new Date().toISOString().slice(0, 10);
        const party: string =
          tx.vendor_customer_name ??
          tx.vendorCustomerName ??
          tx.vendorcustomername ??
          tx.description ??
          'Unknown';

        if (subtype === 'Salaries' || subtype === 'Employee Benefits') {
          built.push({
            id: `tx-${tx.id}`,
            type: 'Salary',
            party,
            category: 'Employee',
            amountDue: amount,
            dueDate: txDate,
            status: calculateStatus(txDate),
            source: 'Auto',
          });
        } else if (subtype === 'Loans' || accountingType === 'Liability') {
          built.push({
            id: `loan-${tx.id}`,
            type: 'Loan EMI',
            party,
            category: 'Loan',
            amountDue: amount,
            dueDate: txDate,
            status: calculateStatus(txDate),
            source: 'Auto',
          });
        }
      }

      setAutoObligations(built);

      // Map DB-stored manual obligations
      const mappedManual: Obligation[] = dbManual.map((row: any) => ({
        id: row.id,
        type: row.type,
        party: row.party,
        category: row.category,
        amountDue: Number(row.amount_due ?? 0),
        dueDate: row.due_date ?? '',
        status: row.status ?? calculateStatus(row.due_date ?? ''),
        source: 'Manual' as const,
        sourceRef: row.source_ref ?? undefined,
      }));
      setManualObligations(mappedManual);
    } catch (err) {
      console.error('[Obligations] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals by category
  const categoryTotals = {
    Employee: obligations
      .filter(o => o.category === 'Employee')
      .reduce((sum, o) => sum + o.amountDue, 0),
    Vendor: obligations
      .filter(o => o.category === 'Vendor')
      .reduce((sum, o) => sum + o.amountDue, 0),
    Loan: obligations
      .filter(o => o.category === 'Loan')
      .reduce((sum, o) => sum + o.amountDue, 0),
    Owner: obligations
      .filter(o => o.category === 'Owner')
      .reduce((sum, o) => sum + o.amountDue, 0),
  };

  const totalLoanBalance = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const totalCreditCardBalance = creditCards.reduce((sum, c) => sum + c.currentBalance, 0);
  const grandTotal = categoryTotals.Employee + categoryTotals.Vendor + categoryTotals.Loan + categoryTotals.Owner;

  const handleCreateObligation = async () => {
    if (newObligation.party.trim() && newObligation.amountDue && newObligation.dueDate) {
      const status = calculateStatus(newObligation.dueDate);
      try {
        const accessToken = await getAccessToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        };
        const res = await fetch('/api/obligations', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: newObligation.type,
            party: newObligation.party,
            category: newObligation.category,
            amountDue: parseInt(newObligation.amountDue),
            dueDate: newObligation.dueDate,
            status,
            source: 'Manual',
          }),
        });
        if (res.ok) {
          const { obligation } = await res.json();
          const mapped: Obligation = {
            id: obligation.id,
            type: obligation.type,
            party: obligation.party,
            category: obligation.category,
            amountDue: Number(obligation.amount_due ?? 0),
            dueDate: obligation.due_date,
            status: obligation.status ?? status,
            source: 'Manual',
            sourceRef: obligation.source_ref ?? undefined,
          };
          setManualObligations(prev => [mapped, ...prev]);
        } else {
          const { error } = await res.json();
          console.error('[Obligations] create failed:', error);
        }
      } catch (err) {
        console.error('[Obligations] create error:', err);
      }
      setNewObligation({ type: 'Vendor Invoice', party: '', amountDue: '', dueDate: '', category: 'Vendor' });
      setShowCreateModal(false);
    }
  };

  const handleDeleteObligation = async (id: string) => {
    // Optimistically remove from UI
    setManualObligations(prev => prev.filter(o => o.id !== id));
    setSelectedObligation(null);
    try {
      const accessToken = await getAccessToken();
      const headers: HeadersInit = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {};
      const res = await fetch(`/api/obligations?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const { error } = await res.json();
        console.error('[Obligations] delete failed:', error);
        // Re-fetch to restore correct state if delete failed
        fetchObligations();
      }
    } catch (err) {
      console.error('[Obligations] delete error:', err);
    }
  };

  const filteredObligations = selectedCategory
    ? obligations.filter(o => o.category === selectedCategory)
    : [];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="pt-6 pb-3 px-8 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Obligations</h1>
          <p className="text-sm text-muted-foreground">Committed payments the business must honor</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchObligations}
            className="p-2 border border-border rounded hover:bg-muted/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-muted-foreground' : 'text-muted-foreground'} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:shadow-md transition-shadow flex items-center gap-2"
          >
            <Plus size={16} />
            Add Obligation
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 py-6 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw size={28} className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading obligations…</p>
          </div>
        ) : !selectedCategory ? (
          <div className="space-y-6">
            {/* Summary Section */}
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Employee Obligations Card */}
                <button
                  onClick={() => setSelectedCategory('Employee')}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-info-bg rounded-lg">
                      <DollarSign size={18} className="text-info" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Employee Obligations</p>
                  <p className="text-2xl font-bold text-foreground">₹{categoryTotals.Employee.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {obligations.filter(o => o.category === 'Employee').length} items
                  </p>
                </button>

                {/* Vendor Obligations Card */}
                <button
                  onClick={() => setSelectedCategory('Vendor')}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-warning-bg rounded-lg">
                      <TrendingUp size={18} className="text-warning" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Vendor Obligations</p>
                  <p className="text-2xl font-bold text-foreground">₹{categoryTotals.Vendor.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {obligations.filter(o => o.category === 'Vendor').length} items
                  </p>
                </button>

                {/* Loans Card */}
                <button
                  onClick={() => setSelectedCategory('Loan')}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <AlertCircle size={18} className="text-purple-600" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Loans Outstanding</p>
                  <p className="text-2xl font-bold text-foreground">₹{categoryTotals.Loan.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {obligations.filter(o => o.category === 'Loan').length} items
                  </p>
                </button>

                {/* Owner Obligations Card */}
                <button
                  onClick={() => setSelectedCategory('Owner')}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-success-bg rounded-lg">
                      <Calendar size={18} className="text-success" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Owner Obligations</p>
                  <p className="text-2xl font-bold text-foreground">₹{categoryTotals.Owner.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {obligations.filter(o => o.category === 'Owner').length} items
                  </p>
                </button>
              </div>

              {/* Total Outstanding */}
              <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Total Outstanding Obligations</p>
                <p className="text-3xl font-bold text-foreground">₹{grandTotal.toLocaleString()}</p>
              </div>
            </div>

            {/* Loans & Credit Cards Section */}
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Liabilities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Loans */}
                <Card className="p-4 border border-border">
                  <h3 className="font-semibold text-foreground mb-3">Active Loans</h3>
                  <div className="space-y-2">
                    {obligations.filter(o => o.category === 'Loan').length > 0 ? (
                      obligations
                        .filter(o => o.category === 'Loan')
                        .map(loan => (
                          <div key={loan.id} className="p-3 bg-muted/30 rounded text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-foreground">{loan.party}</span>
                              <span className="font-bold text-foreground">₹{loan.amountDue.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                          </div>
                        ))
                    ) : (
                      <p className="text-xs text-muted-foreground py-3 text-center">
                        No loan entries. Add a transaction with subtype &ldquo;Loans&rdquo; to see it here.
                      </p>
                    )}
                  </div>
                </Card>

                {/* Credit Cards */}
                <Card className="p-4 border border-border">
                  <h3 className="font-semibold text-foreground mb-3">Active Credit Cards</h3>
                  <div className="space-y-2">
                    {creditCards.length > 0 ? (
                      creditCards.map(card => (
                        <div key={card.id} className="p-3 bg-muted/30 rounded text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-foreground">{card.bank}</span>
                            <span className="text-xs text-muted-foreground">•••• {card.lastFourDigits}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Balance: ₹{card.currentBalance.toLocaleString()}</span>
                            <span className={card.currentBalance > card.creditLimit * 0.8 ? 'text-error' : 'text-muted-foreground'}>
                              {Math.round((card.currentBalance / card.creditLimit) * 100)}% used
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground py-3 text-center">
                        No credit card data available.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-primary hover:underline mb-4"
            >
              ← Back to Summary
            </button>

            {/* Category Title */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                {selectedCategory === 'Employee'
                  ? 'Employee Obligations'
                  : selectedCategory === 'Vendor'
                  ? 'Vendor Obligations'
                  : selectedCategory === 'Loan'
                  ? 'Loans'
                  : 'Owner Obligations'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Total: ₹{categoryTotals[selectedCategory as keyof typeof categoryTotals].toLocaleString()}
              </p>
            </div>

            {/* Obligations List */}
            <div className="space-y-3">
              {filteredObligations.length > 0 ? (
                filteredObligations.map(obl => {
                  const badge = getStatusBadge(obl.status);
                  return (
                    <button
                      key={obl.id}
                      onClick={() => setSelectedObligation(obl)}
                      className="w-full p-4 border border-border rounded-lg hover:bg-muted/50 transition-all text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{obl.party}</p>
                            <span className={`text-xs px-2 py-1 rounded ${badge.bg} ${badge.text}`}>{badge.label}</span>
                            {obl.source === 'Auto' && (
                              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Auto</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{obl.type}</p>
                          {obl.sourceRef && (
                            <p className="text-xs text-muted-foreground">Ref: {obl.sourceRef}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Due: {new Date(obl.dueDate).toLocaleDateString()}</p>
                        </div>
                        <p className="text-lg font-bold text-foreground">₹{obl.amountDue.toLocaleString()}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-center py-8 text-muted-foreground">No obligations in this category</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Obligation Detail Modal */}
      {selectedObligation && selectedObligation.party && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Obligation Details</h2>
              <button
                onClick={() => setSelectedObligation(null)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Party Name</p>
                <p className="text-lg font-semibold text-foreground">{selectedObligation.party}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="text-sm text-foreground">{selectedObligation.type}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Amount Due</p>
                <p className="text-2xl font-bold text-foreground">₹{selectedObligation.amountDue.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selectedObligation.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className={`text-sm font-medium ${getStatusBadge(selectedObligation.status).text}`}>
                    {getStatusBadge(selectedObligation.status).label}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Source</p>
                <p className="text-sm text-foreground">{selectedObligation.source}</p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <Button onClick={() => setSelectedObligation(null)} variant="outline" className="flex-1">
                Close
              </Button>
              {selectedObligation.source !== 'Auto' && (
                <Button
                  onClick={() => handleDeleteObligation(selectedObligation.id)}
                  variant="outline"
                  className="flex-1 text-error hover:text-error/80"
                >
                  Delete
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Create Obligation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Add New Obligation</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Obligation Type</label>
                <select
                  value={newObligation.type}
                  onChange={e => {
                    const type = e.target.value as any;
                    let category: 'Employee' | 'Vendor' | 'Loan' | 'Owner' = 'Vendor';
                    if (type === 'Salary') category = 'Employee';
                    else if (type === 'Loan EMI') category = 'Loan';
                    else if (type === 'Partner Payout') category = 'Owner';
                    setNewObligation({ ...newObligation, type, category });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>Salary</option>
                  <option>Vendor Invoice</option>
                  <option>Loan EMI</option>
                  <option>Advance</option>
                  <option>Partner Payout</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Party Name</label>
                <input
                  type="text"
                  placeholder="e.g., Vendor Name, Employee Name"
                  value={newObligation.party}
                  onChange={e => setNewObligation({ ...newObligation, party: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Amount Due</label>
                <input
                  type="number"
                  placeholder="e.g., 50000"
                  value={newObligation.amountDue}
                  onChange={e => setNewObligation({ ...newObligation, amountDue: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Due Date</label>
                <input
                  type="date"
                  value={newObligation.dueDate}
                  onChange={e => setNewObligation({ ...newObligation, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <Button onClick={() => setShowCreateModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateObligation} className="flex-1">
                Create Obligation
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
