'use client';

import { useState } from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DateRange = 'last-30' | 'last-60' | 'last-90';

interface BucketOutlookItem {
  id: string;
  name: string;
  currentBalance: number;
  monthlyTarget: number;
  trend: 'Stable' | 'Rising' | 'Falling';
  monthsOfCover: number;
  status: 'Healthy' | 'Attention' | 'Critical';
}

interface ReceivableItem {
  id: string;
  party: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
}

interface PayableItem {
  id: string;
  party: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
}

export function CashOutlookScreen() {
  const [dateRange, setDateRange] = useState<DateRange>('last-30');
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);

  const bucketOutlookData: BucketOutlookItem[] = [
    {
      id: '1',
      name: 'Operations',
      currentBalance: 425000,
      monthlyTarget: 180000,
      trend: 'Rising',
      monthsOfCover: 2.4,
      status: 'Healthy',
    },
    {
      id: '2',
      name: 'Emergency Reserve',
      currentBalance: 280000,
      monthlyTarget: 360000,
      trend: 'Stable',
      monthsOfCover: 0.8,
      status: 'Attention',
    },
    {
      id: '3',
      name: 'Tax Liability',
      currentBalance: 95000,
      monthlyTarget: 75000,
      trend: 'Falling',
      monthsOfCover: 1.3,
      status: 'Healthy',
    },
    {
      id: '4',
      name: 'Owner Distributions',
      currentBalance: 150000,
      monthlyTarget: 50000,
      trend: 'Rising',
      monthsOfCover: 3.0,
      status: 'Healthy',
    },
  ];

  const receivablesData: ReceivableItem[] = [
    { id: '1', party: 'Acme Studios', amount: 35000, dueDate: 'Feb 15, 2024', status: 'Unpaid' },
    { id: '2', party: 'Beta Corp', amount: 28500, dueDate: 'Feb 20, 2024', status: 'Unpaid' },
    { id: '3', party: 'Tech Innovations', amount: 12000, dueDate: 'Feb 18, 2024', status: 'Overdue' },
    { id: '4', party: 'Green Energy Ltd', amount: 8500, dueDate: 'Feb 10, 2024', status: 'Overdue' },
  ];

  const payablesData: PayableItem[] = [
    { id: '1', party: 'AWS Services', amount: 15000, dueDate: 'Feb 12, 2024', status: 'Unpaid' },
    { id: '2', party: 'Vendor Inc', amount: 22500, dueDate: 'Feb 18, 2024', status: 'Unpaid' },
    { id: '3', party: 'Office Supplies Co', amount: 8200, dueDate: 'Feb 25, 2024', status: 'Unpaid' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'text-accent';
      case 'Attention':
        return 'text-warning';
      case 'Critical':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'bg-accent/10';
      case 'Attention':
        return 'bg-warning/10';
      case 'Critical':
        return 'bg-destructive/10';
      default:
        return 'bg-muted/10';
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 px-8 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cash Outlook</h1>
          <p className="text-sm text-muted-foreground mt-1">Where cash pressure may appear if the current trend continues.</p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
          <Download size={16} />
          Export
        </Button>
      </div>

      {/* Date Range Selector */}
      <div className="pt-6 px-8 flex items-center gap-2 border-b border-border pb-6">
        {(['last-30', 'last-60', 'last-90'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              dateRange === range
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {range === 'last-30' && 'Last 30 days'}
            {range === 'last-60' && 'Last 60 days'}
            {range === 'last-90' && 'Last 90 days'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 space-y-12">
        {/* Section 1: Summary Signals */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Summary Signals</h2>
          <div className="grid grid-cols-3 gap-6">
            {/* Most Likely Pressure Point */}
            <div className="border border-border rounded-lg p-6 space-y-2 bg-card hover:bg-muted/20 transition-colors">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Most Likely Pressure Point</p>
              <p className="text-sm text-foreground leading-relaxed">
                Emergency Reserve running 23% below target. May deplete in 2-3 months if trend continues.
              </p>
            </div>

            {/* Safest Bucket */}
            <div className="border border-border rounded-lg p-6 space-y-2 bg-card hover:bg-muted/20 transition-colors">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safest Bucket</p>
              <p className="text-sm text-foreground leading-relaxed">
                Owner Distributions bucket strong at 3+ months of cover. Room for distributions if needed.
              </p>
            </div>

            {/* Receivables Risk */}
            <div className="border border-border rounded-lg p-6 space-y-2 bg-card hover:bg-muted/20 transition-colors">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receivables Risk</p>
              <p className="text-sm text-foreground leading-relaxed">
                ₹40,500 in receivables at risk. 2 overdue invoices need immediate follow-up.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Bucket Outlook Table */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Bucket Outlook</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div>Bucket Name</div>
              <div>Current Balance (₹)</div>
              <div>Monthly Target (₹)</div>
              <div>Trend</div>
              <div>Months of Cover</div>
              <div>Outlook Status</div>
            </div>

            {/* Rows */}
            {bucketOutlookData.map((bucket) => (
              <button
                key={bucket.id}
                onClick={() => setSelectedBucketId(bucket.id)}
                className="w-full grid grid-cols-6 gap-4 px-6 py-4 border-t border-border hover:bg-muted/20 transition-colors items-center text-left group"
              >
                <div className="text-sm font-medium text-foreground group-hover:text-primary">{bucket.name}</div>
                <div className="text-sm text-foreground">₹{bucket.currentBalance.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">₹{bucket.monthlyTarget.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{bucket.trend}</div>
                <div className="text-sm text-foreground font-medium">{bucket.monthsOfCover.toFixed(1)}</div>
                <div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusBgColor(bucket.status)} ${getStatusColor(bucket.status)}`}>
                    {bucket.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 3: Invoice Outlook */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Invoice Outlook</h2>
          <div className="grid grid-cols-2 gap-8">
            {/* Receivables Due Soon */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-3 bg-muted/40">
                <h3 className="text-sm font-semibold text-foreground">Receivables Due Soon</h3>
              </div>
              <div className="divide-y divide-border">
                {receivablesData.map((item) => (
                  <div key={item.id} className="px-6 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground">{item.party}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        item.status === 'Overdue' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">₹{item.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{item.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payables Due Soon */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-3 bg-muted/40">
                <h3 className="text-sm font-semibold text-foreground">Payables Due Soon</h3>
              </div>
              <div className="divide-y divide-border">
                {payablesData.map((item) => (
                  <div key={item.id} className="px-6 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground">{item.party}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">₹{item.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{item.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
