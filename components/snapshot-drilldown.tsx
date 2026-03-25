'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { X, ChevronLeft } from 'lucide-react';

type DrillDownView = 'none' | 'revenue' | 'expense' | 'ar' | 'ap';

export function SnapshotDrillDown() {
  const { state, getMetrics } = useAppState();
  const [drillDown, setDrillDown] = useState<DrillDownView>('none');
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-02-05' });

  const metrics = getMetrics();

  const getFilteredTransactions = () => {
    return state.transactions.filter((t) => {
      const txnDate = new Date(t.date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return txnDate >= start && txnDate <= end && t.status === 'Recorded';
    });
  };

  const getFilteredInvoices = () => {
    return state.invoices.filter((inv) => {
      const invDate = new Date(inv.dueDate);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return invDate >= start && invDate <= end;
    });
  };

  const revenueTransactions = getFilteredTransactions().filter((t) => t.isIncome);
  const expenseTransactions = getFilteredTransactions().filter((t) => !t.isIncome);
  const arInvoices = getFilteredInvoices().filter((inv) => inv.type === 'Revenue' && inv.balanceDue > 0);
  const apInvoices = getFilteredInvoices().filter((inv) => inv.type === 'Expense' && inv.balanceDue > 0);

  if (drillDown !== 'none') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDrillDown('none')}
                  className="p-2 hover:bg-muted rounded transition-colors"
                >
                  <ChevronLeft size={20} className="text-muted-foreground" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {drillDown === 'revenue' && 'Revenue Transactions'}
                    {drillDown === 'expense' && 'Expense Transactions'}
                    {drillDown === 'ar' && 'Accounts Receivable'}
                    {drillDown === 'ap' && 'Accounts Payable'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {dateRange.start} to {dateRange.end}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrillDown('none')}
                className="p-2 hover:bg-muted rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {(drillDown === 'revenue' || drillDown === 'expense') && (
                <div className="divide-y divide-border">
                  {/* Metrics Summary */}
                  <div className="p-6 bg-muted/50 flex gap-8">
                    {drillDown === 'revenue' && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="text-2xl font-bold text-accent">
                            ₹{revenueTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Transaction Count</p>
                          <p className="text-2xl font-bold">{revenueTransactions.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Average Transaction</p>
                          <p className="text-2xl font-bold">
                            ₹{Math.round(
                              revenueTransactions.reduce((sum, t) => sum + t.amount, 0) /
                                (revenueTransactions.length || 1)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                    {drillDown === 'expense' && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Expense</p>
                          <p className="text-2xl font-bold text-destructive">
                            ₹{expenseTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Transaction Count</p>
                          <p className="text-2xl font-bold">{expenseTransactions.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Average Transaction</p>
                          <p className="text-2xl font-bold">
                            ₹{Math.round(
                              expenseTransactions.reduce((sum, t) => sum + t.amount, 0) /
                                (expenseTransactions.length || 1)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(drillDown === 'revenue' ? revenueTransactions : expenseTransactions).map((txn) => (
                          <tr key={txn.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-foreground">{txn.date}</td>
                            <td className="px-6 py-4 text-sm text-foreground">{txn.description}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{txn.subtype}</td>
                            <td className="px-6 py-4 text-sm font-medium">
                              <span className={drillDown === 'revenue' ? 'text-accent' : 'text-destructive'}>
                                ₹{txn.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">₹{txn.gstSplit.gst}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{txn.invoice || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(drillDown === 'ar' || drillDown === 'ap') && (
                <div className="divide-y divide-border">
                  {/* Summary */}
                  <div className="p-6 bg-muted/50 flex gap-8">
                    {drillDown === 'ar' && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Outstanding</p>
                          <p className="text-2xl font-bold text-accent">
                            ₹{arInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Invoice Count</p>
                          <p className="text-2xl font-bold">{arInvoices.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Collection Rate</p>
                          <p className="text-2xl font-bold">
                            {Math.round(
                              (state.invoices
                                .filter((inv) => inv.type === 'Revenue')
                                .reduce((sum, inv) => sum + inv.paidAmount, 0) /
                                state.invoices
                                  .filter((inv) => inv.type === 'Revenue')
                                  .reduce((sum, inv) => sum + inv.invoiceAmount, 0)) *
                                100 || 0
                            )}
                            %
                          </p>
                        </div>
                      </>
                    )}
                    {drillDown === 'ap' && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Outstanding</p>
                          <p className="text-2xl font-bold text-destructive">
                            ₹{apInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bill Count</p>
                          <p className="text-2xl font-bold">{apInvoices.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Rate</p>
                          <p className="text-2xl font-bold">
                            {Math.round(
                              (state.invoices
                                .filter((inv) => inv.type === 'Expense')
                                .reduce((sum, inv) => sum + inv.paidAmount, 0) /
                                state.invoices
                                  .filter((inv) => inv.type === 'Expense')
                                  .reduce((sum, inv) => sum + inv.invoiceAmount, 0)) *
                                100 || 0
                            )}
                            %
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Invoices Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice No.</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Party</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(drillDown === 'ar' ? arInvoices : apInvoices).map((inv) => (
                          <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-foreground">{inv.invoiceNo}</td>
                            <td className="px-6 py-4 text-sm text-foreground">{inv.partyName}</td>
                            <td className="px-6 py-4 text-sm text-foreground">₹{inv.invoiceAmount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-foreground">₹{inv.paidAmount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-medium">
                              <span className={inv.balanceDue > 0 ? 'text-destructive' : 'text-accent'}>
                                ₹{inv.balanceDue.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{inv.dueDate}</td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  inv.status === 'Paid'
                                    ? 'bg-accent/20 text-accent'
                                    : inv.status === 'Partial'
                                      ? 'bg-yellow-500/20 text-yellow-600'
                                      : inv.status === 'Overdue'
                                        ? 'bg-destructive/20 text-destructive'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <button
        onClick={() => setDrillDown('revenue')}
        className="flex-1 min-w-48 p-6 bg-card border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all cursor-pointer text-left"
      >
        <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
        <p className="text-3xl font-bold text-accent mb-1">₹{metrics.totalRevenue.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Click to see transactions</p>
      </button>

      <button
        onClick={() => setDrillDown('expense')}
        className="flex-1 min-w-48 p-6 bg-card border border-border rounded-lg hover:border-destructive hover:bg-destructive/5 transition-all cursor-pointer text-left"
      >
        <p className="text-sm text-muted-foreground mb-2">Total Expense</p>
        <p className="text-3xl font-bold text-destructive mb-1">₹{metrics.totalExpense.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Click to see transactions</p>
      </button>

      <button
        onClick={() => setDrillDown('ar')}
        className="flex-1 min-w-48 p-6 bg-card border border-border rounded-lg hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer text-left"
      >
        <p className="text-sm text-muted-foreground mb-2">Accounts Receivable</p>
        <p className="text-3xl font-bold text-blue-600 mb-1">₹{metrics.arBalance.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Click to see invoices</p>
      </button>

      <button
        onClick={() => setDrillDown('ap')}
        className="flex-1 min-w-48 p-6 bg-card border border-border rounded-lg hover:border-orange-500 hover:bg-orange-500/5 transition-all cursor-pointer text-left"
      >
        <p className="text-sm text-muted-foreground mb-2">Accounts Payable</p>
        <p className="text-3xl font-bold text-orange-600 mb-1">₹{metrics.apBalance.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Click to see bills</p>
      </button>
    </div>
  );
}
