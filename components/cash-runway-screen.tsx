'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { useOrganization } from '@/context/organization-context';
import { getSupabaseClient } from '@/lib/supabase/client';

interface CashProjection {
  month: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  closingBalance: number;
  netCashFlow: number;
}

type BankAccountApiRow = {
  id: string;
  balance: number | null;
};

type TransactionApiRow = {
  id: string;
  date: string | null;
  amount: number | null;
  is_income: boolean | null;
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

export function CashRunwayScreen() {
  const { currentOrganization } = useOrganization();
  const [currentCash, setCurrentCash] = useState(0);
  const [bankAccountCount, setBankAccountCount] = useState(0);
  const [transactions, setTransactions] = useState<TransactionApiRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleTransactionsUpdated = () => {
      setRefreshKey((prev) => prev + 1);
    };

    const handleWindowFocus = () => {
      setRefreshKey((prev) => prev + 1);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey((prev) => prev + 1);
      }
    };

    window.addEventListener('finance:transactions-updated', handleTransactionsUpdated);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('finance:transactions-updated', handleTransactionsUpdated);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentCash = async () => {
      try {
        const accessToken = await getAccessToken();
        const response = await fetch('/api/bank-accounts', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error ?? 'Failed to fetch bank accounts.');
        }

        const accounts = (result.accounts ?? []) as BankAccountApiRow[];
        const total = accounts.reduce((sum, account) => sum + (account.balance ?? 0), 0);

        if (isMounted) {
          setCurrentCash(total);
          setBankAccountCount(accounts.length);
        }
      } catch {
        if (isMounted) {
          setCurrentCash(0);
          setBankAccountCount(0);
        }
      }
    };

    void fetchCurrentCash();

    return () => {
      isMounted = false;
    };
  }, [currentOrganization?.id, refreshKey]);

  useEffect(() => {
    let isMounted = true;

    const fetchTransactions = async () => {
      try {
        const accessToken = await getAccessToken();
        const response = await fetch('/api/transactions', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error ?? 'Failed to fetch transactions.');
        }

        if (isMounted) {
          setTransactions((result.transactions ?? []) as TransactionApiRow[]);
        }
      } catch {
        if (isMounted) {
          setTransactions([]);
        }
      }
    };

    void fetchTransactions();

    return () => {
      isMounted = false;
    };
  }, [currentOrganization?.id, refreshKey]);

  const getMonthKey = (dateValue: string | null | undefined) => {
    if (!dateValue) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue.slice(0, 7);
    }
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  };

  const monthlyTotals: Record<string, { inflow: number; outflow: number }> = {};
  transactions.forEach((t) => {
    const key = getMonthKey(t.date);
    if (!key) return;
    if (!monthlyTotals[key]) monthlyTotals[key] = { inflow: 0, outflow: 0 };
    const amount = Math.abs(Number(t.amount ?? 0));
    if (Boolean(t.is_income)) {
      monthlyTotals[key].inflow += amount;
    } else {
      monthlyTotals[key].outflow += amount;
    }
  });

  const displayMonths = 2;

  // Show only previous + current month (no future months)
  const generateProjections = (): CashProjection[] => {
    const projections: CashProjection[] = [];
    const now = new Date();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const currKey = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}`;

    const prevNet = (monthlyTotals[prevKey]?.inflow ?? 0) - (monthlyTotals[prevKey]?.outflow ?? 0);
    const currNet = (monthlyTotals[currKey]?.inflow ?? 0) - (monthlyTotals[currKey]?.outflow ?? 0);

    const currentMonthOpening = currentCash - currNet;
    let balance = currentMonthOpening - prevNet;
    
    for (let i = -1; i <= 0; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const month = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      const inflows = monthlyTotals[monthKey]?.inflow ?? 0;
      const outflows = monthlyTotals[monthKey]?.outflow ?? 0;
      const closingBalance = balance + inflows - outflows;
      const netCashFlow = closingBalance;
      
      projections.push({
        month,
        openingBalance: balance,
        inflows,
        outflows,
        closingBalance,
        netCashFlow,
      });
      
      balance = closingBalance;
    }
    
    return projections;
  };

  const projections = generateProjections();

  
  // Calculate runway metrics
  const negativeMonth = projections.findIndex((p) => p.closingBalance < 0);
  const runway = negativeMonth >= 0 ? negativeMonth + 1 : displayMonths;
  const finalBalance = projections[displayMonths - 1]?.closingBalance || 0;
  const totalInflows = projections.reduce((sum, p) => sum + p.inflows, 0);
  const totalOutflows = projections.reduce((sum, p) => sum + p.outflows, 0);
  
  const getRunwayColor = () => {
    if (runway < 3) return 'text-destructive';
    if (runway < 6) return 'text-warning';
    return 'text-accent';
  };
  
  const getBalanceColor = (balance: number) => {
    if (balance < 0) return 'text-destructive';
    if (balance < 100000) return 'text-warning';
    return 'text-emerald-700 dark:text-emerald-400';
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="pt-6 pb-4 px-8 border-b border-border">
        <p className="text-sm text-muted-foreground mb-4">Project cash position based on revenue, obligations, and burn rate</p>
        
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Showing previous and current month only</div>
      </div>

      {/* Current Cash */}
      <div className="bg-muted/20 border-b border-border px-8 py-6">
        <div className="rounded-lg border border-border bg-background px-6 py-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Current Cash</p>
          <p className="text-3xl font-semibold text-foreground">₹{currentCash.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Calculated from {bankAccountCount} bank account{bankAccountCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Warning if runway is low */}
      {runway < 6 && (
        <div className="bg-warning/5 border-b border-warning/20 px-8 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Low Cash Runway Warning</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your cash runway is below 6 months. Review revenue forecasts, reduce expenses, or secure funding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cash Projection Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div>Month</div>
              <div className="text-right">Opening Balance</div>
              <div className="text-right">Inflows</div>
              <div className="text-right">Outflows</div>
              <div className="text-right">Net Cash Flow</div>
              <div className="text-right">Closing Balance</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {projections.map((proj, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-6 gap-4 px-6 py-4 items-center transition-colors ${
                    proj.closingBalance < 0 ? 'bg-destructive/5' : idx % 2 === 0 ? 'bg-muted/5' : 'bg-background'
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">{proj.month}</div>
                  <div className="text-right text-sm">
                    ₹{proj.openingBalance.toLocaleString()}
                  </div>
                  <div className="text-right text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    ₹{proj.inflows.toLocaleString()}
                  </div>
                  <div className="text-right text-sm font-medium text-destructive">
                    ₹{proj.outflows.toLocaleString()}
                  </div>
                  <div className={`text-right text-sm font-medium ${proj.netCashFlow < 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    ₹{proj.netCashFlow.toLocaleString()}
                  </div>
                  <div className={`text-right text-sm font-semibold ${getBalanceColor(proj.closingBalance)}`}>
                    ₹{proj.closingBalance.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8 space-y-4">
            <div className="border border-border rounded-lg p-6 bg-muted/5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Forecast Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Total Inflows ({displayMonths} months)</p>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">₹{totalInflows.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Total Outflows ({displayMonths} months)</p>
                  <p className="font-medium text-destructive">₹{totalOutflows.toLocaleString()}</p>
                </div>
                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <p className="text-foreground font-medium">Projected Final Balance</p>
                  <p className={`text-lg font-semibold ${getBalanceColor(finalBalance)}`}>
                    ₹{finalBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Assumptions */}
            <div className="border border-border rounded-lg p-6 bg-muted/5">
              <div className="flex items-start gap-2 mb-3">
                <Info size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                <h3 className="text-sm font-semibold text-foreground">Projection Assumptions</h3>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Inflows are summed from all income transactions in each month.</li>
                <li>Outflows are summed from all expense transactions in each month.</li>
                <li>Net cash flow is calculated as Opening Balance + Inflow - Outflow.</li>
                <li>Closing balance is equal to net cash flow for each month.</li>
                <li>Only previous and current months are shown.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
