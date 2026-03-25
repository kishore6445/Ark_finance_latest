'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { TrendingUp, TrendingDown } from 'lucide-react';

type AgingBucket = '0-30' | '30-60' | '60-90' | '90+';

export function AgingAnalysisScreen() {
  const { state } = useAppState();
  const [reportType, setReportType] = useState<'ar' | 'ap'>('ar');

  const calculateAgingBuckets = (invoices: typeof state.invoices, type: 'ar' | 'ap') => {
    const filtered = invoices.filter((inv) => {
      if (type === 'ar') return inv.type === 'Revenue' && inv.balanceDue > 0;
      return inv.type === 'Expense' && inv.balanceDue > 0;
    });

    const now = new Date();
    const buckets: Record<AgingBucket, typeof filtered> = {
      '0-30': [],
      '30-60': [],
      '60-90': [],
      '90+': [],
    };

    filtered.forEach((inv) => {
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue <= 30) buckets['0-30'].push(inv);
      else if (daysOverdue <= 60) buckets['30-60'].push(inv);
      else if (daysOverdue <= 90) buckets['60-90'].push(inv);
      else buckets['90+'].push(inv);
    });

    return buckets;
  };

  const arBuckets = calculateAgingBuckets(state.invoices, 'ar');
  const apBuckets = calculateAgingBuckets(state.invoices, 'ap');
  const buckets = reportType === 'ar' ? arBuckets : apBuckets;

  const getTotalByBucket = (bucket: AgingBucket) => {
    return buckets[bucket].reduce((sum, inv) => sum + inv.balanceDue, 0);
  };

  const getTotalCount = (bucket: AgingBucket) => {
    return buckets[bucket].length;
  };

  const getTotalOutstanding = () => {
    return Object.values(buckets)
      .flat()
      .reduce((sum, inv) => sum + inv.balanceDue, 0);
  };

  const getPercentageByBucket = (bucket: AgingBucket) => {
    const total = getTotalOutstanding();
    return total === 0 ? 0 : Math.round((getTotalByBucket(bucket) / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {reportType === 'ar' ? 'Accounts Receivable' : 'Accounts Payable'} Aging Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Days overdue from invoice due date
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setReportType('ar')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              reportType === 'ar'
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            Receivables
          </button>
          <button
            onClick={() => setReportType('ap')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              reportType === 'ap'
                ? 'bg-orange-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            Payables
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Total Outstanding</p>
          <p className={`text-2xl font-bold ${
            reportType === 'ar' ? 'text-blue-600' : 'text-orange-600'
          }`}>
            ₹{getTotalOutstanding().toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {Object.values(buckets)
              .flat()
              .length}{' '}
            invoices
          </p>
        </div>

        {(['0-30', '30-60', '60-90', '90+'] as AgingBucket[]).map((bucket) => (
          <div key={bucket} className="p-4 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">{bucket} Days</p>
            <p className="text-2xl font-bold">₹{getTotalByBucket(bucket).toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    bucket === '0-30'
                      ? 'bg-green-500'
                      : bucket === '30-60'
                        ? 'bg-yellow-500'
                        : bucket === '60-90'
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${getPercentageByBucket(bucket)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground min-w-8">
                {getPercentageByBucket(bucket)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Aging Table by Bucket */}
      <div className="space-y-4">
        {(['0-30', '30-60', '60-90', '90+'] as AgingBucket[]).map((bucket) => (
          <div key={bucket} className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Bucket Header */}
            <div className="px-6 py-4 bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    bucket === '0-30'
                      ? 'bg-green-500'
                      : bucket === '30-60'
                        ? 'bg-yellow-500'
                        : bucket === '60-90'
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                  }`}
                />
                <h3 className="font-semibold text-foreground">{bucket} Days</h3>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Count: </span>
                  <span className="font-medium">{getTotalCount(bucket)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount: </span>
                  <span className="font-medium">₹{getTotalByBucket(bucket).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Bucket Items */}
            {buckets[bucket].length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-t border-border">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {reportType === 'ar' ? 'Invoice' : 'Bill'} No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Party
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Invoice Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Balance Due
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {buckets[bucket].map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {inv.invoiceNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{inv.partyName}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {inv.dueDate}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium">
                          ₹{inv.invoiceAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-foreground">
                          ₹{inv.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium">
                          <span
                            className={
                              reportType === 'ar' ? 'text-destructive' : 'text-destructive'
                            }
                          >
                            ₹{inv.balanceDue.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
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
            ) : (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No invoices in this aging bucket
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Insights */}
      <div className="p-6 bg-muted/30 border border-border rounded-lg space-y-3">
        <p className="font-semibold text-foreground">Key Insights</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-muted-foreground">•</span>
            <span>
              {getTotalCount('90+')} invoices overdue more than 90 days (
              {getPercentageByBucket('90+')}% of total)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">•</span>
            <span>
              {getTotalCount('0-30')} invoices due within 30 days (
              {getPercentageByBucket('0-30')}% of total)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-muted-foreground">•</span>
            <span>
              Average invoice age:{' '}
              {Object.values(buckets)
                .flat()
                .length > 0
                ? Math.round(
                    Object.values(buckets)
                      .flat()
                      .reduce((sum, inv) => {
                        const daysOld = Math.floor(
                          (new Date().getTime() - new Date(inv.dueDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return sum + daysOld;
                      }, 0) / Object.values(buckets).flat().length
                  )
                : 0}{' '}
              days
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
