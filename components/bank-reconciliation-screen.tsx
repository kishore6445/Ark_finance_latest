'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Eye, TrendingDown } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'matched' | 'pending' | 'unmatched';
  bankDate?: string;
  bankAccountId?: string | null;
}

interface InboxTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  isIncome: boolean;
  status: 'Recorded' | 'Needs Info' | 'Action Required';
  bankDate?: string;
  bankAccountId?: string | null;
}

interface BankAccountOption {
  id: string;
  accountName: string;
}

async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const token = data.session?.access_token;
  if (!token) throw new Error('Missing session token. Please sign in again.');
  return token;
}

export function BankReconciliationScreen() {
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [matchingMode, setMatchingMode] = useState<'auto' | 'manual'>('auto');
  const [selectedMatches, setSelectedMatches] = useState<Map<string, string>>(new Map());
  const [viewingDiscrepancy, setViewingDiscrepancy] = useState<string | null>(null);

  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [inboxTransactions, setInboxTransactions] = useState<InboxTransaction[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load bank accounts for the account selector
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/bank-accounts', { headers: { Authorization: `Bearer ${token}` } });
        const result = await res.json();
        if (!res.ok) throw new Error(result?.error ?? 'Failed to load bank accounts.');
        const accounts: BankAccountOption[] = (result.accounts ?? []).map((a: any) => ({
          id: a.id,
          accountName: a.account_name,
        }));
        setBankAccounts(accounts);
        if (accounts.length > 0) setSelectedAccount(accounts[0].id);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load bank accounts.');
      }
    };
    void load();
  }, []);

  // Load transactions from API and derive bank + inbox lists
  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/transactions', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error ?? 'Failed to load transactions.');

      const raw: any[] = result.transactions ?? result.data ?? [];

      // Build available periods (YYYY-MM) from transaction dates
      const periodSet = new Set<string>(raw.map((t) => (t.date as string).substring(0, 7)));
      const sortedPeriods = Array.from(periodSet).sort().reverse();
      setPeriods(sortedPeriods);
      if (sortedPeriods.length > 0 && !selectedPeriod) setSelectedPeriod(sortedPeriods[0]);

      // Recorded (inbox) transactions — all transactions in system
      const inbox: InboxTransaction[] = raw.map((t) => ({
        id: t.id,
        date: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        description: t.description,
        amount: t.amount,
        isIncome: t.is_income ?? t.isIncome,
        status: (t.status === 'Recorded' || t.status === 'Needs Info' || t.status === 'Action Required')
          ? t.status
          : 'Recorded',
        bankDate: t.date,
        bankAccountId: t.bank_account_id ?? t.bankAccountId ?? t.assigned_bank_account_id ?? null,
      }));
      setInboxTransactions(inbox);

      // Bank-side: derive from transactions (unmatched by default unless already reconciled)
      const bank: BankTransaction[] = raw.map((t) => ({
        id: `bank-${t.id}`,
        date: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        description: (t.description as string).toUpperCase(),
        amount: t.amount,
        type: (t.is_income ?? t.isIncome) ? 'credit' : 'debit',
        status: t.reconciliation_status === 'matched' ? 'matched'
              : t.reconciliation_status === 'pending' ? 'pending'
              : 'unmatched',
        bankDate: t.date,
        bankAccountId: t.bank_account_id ?? t.bankAccountId ?? t.assigned_bank_account_id ?? null,
      }));
      setBankTransactions(bank);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load transactions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadTransactions(); }, [loadTransactions]);

  // Filter by selected account and period
  const filteredBank = bankTransactions.filter((t) => {
    const periodMatch = !selectedPeriod || (t.bankDate ?? '').startsWith(selectedPeriod);
    const accountMatch = !selectedAccount || (t.bankAccountId ?? '') === selectedAccount;
    return periodMatch && accountMatch;
  });

  const filteredInbox = inboxTransactions.filter((t) => {
    const periodMatch = !selectedPeriod || (t.bankDate ?? '').startsWith(selectedPeriod);
    const accountMatch = !selectedAccount || (t.bankAccountId ?? '') === selectedAccount;
    return periodMatch && accountMatch;
  });

  // Calculate days since transaction using real today
  const getDaysSince = (bankDate?: string): number => {
    if (!bankDate) return 0;
    const txnDate = new Date(bankDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Find discrepancies between amounts
  const getDiscrepancies = (bankTxn: BankTransaction, inboxTxn: InboxTransaction) => {
    const diff = Math.abs(bankTxn.amount - inboxTxn.amount);
    const percentDiff = (diff / Math.max(bankTxn.amount, inboxTxn.amount)) * 100;
    if (diff === 0) return null;
    return {
      difference: diff,
      percentDiff: percentDiff.toFixed(1),
      type: diff <= 100 ? 'rounding' : diff <= 500 ? 'minor' : 'major',
    };
  };

  // Find potential matches from filtered inbox transactions
  const getPotentialMatches = (bankTxn: BankTransaction) => {
    return filteredInbox.filter((inbox) => {
      const amountMatch = Math.abs(bankTxn.amount - inbox.amount) <= 1000;
      const typeMatch = (bankTxn.type === 'credit') === inbox.isIncome;
      return amountMatch && typeMatch;
    });
  };

  const matchedCount = filteredBank.filter((t) => t.status === 'matched').length;
  const unmatchedCount = filteredBank.filter((t) => t.status === 'unmatched').length;
  const pendingCount = filteredBank.filter((t) => t.status === 'pending').length;
  const matchPercentage = filteredBank.length > 0
    ? Math.round((matchedCount / filteredBank.length) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'text-accent bg-accent/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      case 'unmatched':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle2 size={16} className="text-accent flex-shrink-0" />;
      case 'unmatched':
        return <AlertCircle size={16} className="text-destructive flex-shrink-0" />;
      case 'pending':
        return <Eye size={16} className="text-warning flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getAgingStatus = (days: number) => {
    if (days <= 3) return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Recent' };
    if (days <= 7) return { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: `${days}d old` };
    return { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: `${days}d overdue` };
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="pt-6 pb-4 px-8 border-b border-border">
        <p className="text-sm text-muted-foreground mb-4">Match bank transactions to inbox entries for accurate cash position</p>

        {error && (
          <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Account & Period Selectors */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Account</p>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {bankAccounts.length === 0 && <option value="">No accounts</option>}
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.accountName}</option>
              ))}
            </select>
          </div>
          <div className="ml-8">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Period</p>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All periods</option>
              {periods.map((p) => {
                const [year, month] = p.split('-');
                const label = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                return <option key={p} value={p}>{label}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="bg-muted/20 border-b border-border px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Match Progress</p>
              <p className="text-2xl font-semibold text-accent">{matchPercentage}%</p>
            </div>
            <div className="flex items-center gap-6 pl-6 border-l border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Matched</p>
                <p className="text-lg font-semibold text-accent">{matchedCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
                <p className="text-lg font-semibold text-warning">{pendingCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Unmatched</p>
                <p className="text-lg font-semibold text-destructive">{unmatchedCount}</p>
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 bg-background rounded p-1 border border-border">
            {(['auto', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMatchingMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  matchingMode === mode
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'auto' ? 'Smart Match' : 'Manual'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading transactions...</div>
        ) : filteredBank.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">No transactions found for this period.</div>
        ) : (
        <div className="grid grid-cols-2 gap-8 p-8">
          {/* LEFT: Bank Transactions */}
          <div>
            <h2 className="text-lg font-medium mb-4">Bank Transactions</h2>
            <div className="space-y-3">
              {filteredBank.map((txn) => {
                const agingStatus = getAgingStatus(getDaysSince(txn.bankDate));
                const potentialMatches = getPotentialMatches(txn);
                
                return (
                  <div key={txn.id} className="border border-border rounded-lg p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{txn.date}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                        {txn.type === 'credit' ? '+' : '−'}₹{txn.amount.toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Status and Aging Badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${getStatusColor(txn.status)}`}>
                        {getStatusIcon(txn.status)}
                        {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                      </div>
                      {txn.status === 'unmatched' && (
                        <div className={`text-xs font-medium px-2 py-1 rounded ${agingStatus.color}`}>
                          {agingStatus.label}
                        </div>
                      )}
                    </div>

                    {/* Potential Matches */}
                    {potentialMatches.length > 0 && txn.status === 'unmatched' && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Possible Matches:</p>
                        <div className="space-y-1">
                          {potentialMatches.map(match => {
                            const discrepancy = getDiscrepancies(txn, match);
                            return (
                              <button
                                key={match.id}
                                onClick={() => setSelectedMatches(new Map(selectedMatches).set(txn.id, match.id))}
                                className={`w-full text-left p-2 rounded text-xs border transition-colors ${
                                  selectedMatches.get(txn.id) === match.id
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-muted/30 border-border hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="font-medium text-foreground">{match.description}</span>
                                  <span className="text-foreground font-semibold">₹{match.amount.toLocaleString()}</span>
                                </div>
                                {discrepancy && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <TrendingDown size={12} />
                                    Variance: ₹{discrepancy.difference} ({discrepancy.percentDiff}%)
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Inbox Transactions */}
          <div>
            <h2 className="text-lg font-medium mb-4">Recorded Transactions</h2>
            <div className="space-y-3">
              {filteredInbox.map((txn) => (
                <div key={txn.id} className="border border-border rounded-lg p-4 bg-accent/5 hover:bg-accent/10 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{txn.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-accent whitespace-nowrap">
                      {txn.isIncome ? '+' : '−'}₹{txn.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-xs text-accent font-medium flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    Matched
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Discrepancy & Matching Panel */}
      {!isLoading && unmatchedCount > 0 && (
        <div className="border-t border-border bg-muted/10 p-8">
          <div className="max-w-6xl">
            <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
              <AlertCircle size={20} className="text-destructive" />
              Reconciliation Issues ({unmatchedCount})
            </h3>

            {/* Tabs for different issue types */}
            <div className="flex gap-4 mb-6 border-b border-border pb-4">
              <button className="px-4 py-2 text-sm font-medium text-foreground border-b-2 border-primary">
                All Issues
              </button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Aged Transactions
              </button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Amount Discrepancies
              </button>
            </div>

            <div className="space-y-4">
              {filteredBank
                .filter((t) => t.status === 'unmatched')
                .map((txn) => {
                  const agingStatus = getAgingStatus(getDaysSince(txn.bankDate));
                  const potentialMatches = getPotentialMatches(txn);
                  const days = getDaysSince(txn.bankDate);
                  
                  return (
                    <div 
                      key={txn.id} 
                      className={`p-4 bg-background rounded border-2 transition-colors cursor-pointer ${
                        viewingDiscrepancy === txn.id ? 'border-primary bg-primary/5' : 'border-border hover:border-destructive/30'
                      }`}
                      onClick={() => setViewingDiscrepancy(viewingDiscrepancy === txn.id ? null : txn.id)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-semibold text-foreground">{txn.description}</p>
                            <div className={`text-xs font-medium px-2 py-0.5 rounded ${agingStatus.color}`}>
                              {agingStatus.label}
                            </div>
                            {days > 7 && (
                              <div className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                Critical: {days} days
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{txn.date} • {txn.type === 'credit' ? 'Credit' : 'Debit'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-semibold">{txn.type === 'credit' ? '+' : '−'}₹{txn.amount.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Expand when clicked */}
                      {viewingDiscrepancy === txn.id && potentialMatches.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          <p className="text-sm font-medium text-foreground">Found {potentialMatches.length} potential match(es):</p>
                          {potentialMatches.map(match => {
                            const discrepancy = getDiscrepancies(txn, match);
                            return (
                              <div 
                                key={match.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMatches(new Map(selectedMatches).set(txn.id, match.id));
                                }}
                                className={`p-3 rounded border-2 transition-colors cursor-pointer ${
                                  selectedMatches.get(txn.id) === match.id
                                    ? 'bg-accent/10 border-accent'
                                    : 'bg-muted/30 border-border hover:border-accent/50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{match.description}</p>
                                    <p className="text-xs text-muted-foreground">{match.date}</p>
                                  </div>
                                  <span className="text-sm font-semibold text-accent">₹{match.amount.toLocaleString()}</span>
                                </div>
                                {discrepancy && (
                                  <div className={`text-xs font-medium px-2 py-1 rounded inline-flex items-center gap-1 ${
                                    discrepancy.type === 'rounding' 
                                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      : discrepancy.type === 'minor'
                                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                    <TrendingDown size={12} />
                                    Variance: ₹{discrepancy.difference} ({discrepancy.percentDiff}%)
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {viewingDiscrepancy === txn.id && potentialMatches.length === 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-3">No potential matches found within ±₹1,000</p>
                          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                            Create Manual Entry
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
