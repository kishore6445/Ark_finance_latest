'use client';

import { ArrowLeft } from 'lucide-react';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  source: 'Bank' | 'Invoice';
}

interface BucketDetailProps {
  bucketId: string;
  onBack: () => void;
}

export function BucketDetail({ bucketId, onBack }: BucketDetailProps) {
  // Sample data for the selected bucket
  const bucket = {
    id: bucketId,
    name: 'Operations',
    type: 'Operating',
    currentBalance: 145000,
    monthlyTarget: 80000,
    status: 'healthy',
    allocationRule: 'Monthly operating expenses like payroll, rent, and utilities.',
    transactions: [
      {
        date: 'Feb 3',
        description: 'Salary - Priya Sharma',
        amount: 65000,
        source: 'Bank' as const,
      },
      {
        date: 'Jan 31',
        description: 'Office Rent - January',
        amount: 25000,
        source: 'Bank' as const,
      },
      {
        date: 'Jan 28',
        description: 'AWS Services - Monthly',
        amount: 8500,
        source: 'Bank' as const,
      },
      {
        date: 'Jan 25',
        description: 'Internet & Utilities',
        amount: 3200,
        source: 'Bank' as const,
      },
      {
        date: 'Jan 20',
        description: 'Office Supplies',
        amount: 1850,
        source: 'Invoice' as const,
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-accent';
      case 'attention':
        return 'text-warning';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'attention':
        return 'Attention';
      case 'critical':
        return 'Critical';
      default:
        return status;
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="pt-8 pb-4 px-6 border-b border-border flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <p className="text-muted-foreground text-sm">Financial explanation</p>
      </div>

      {/* Two-Column Layout */}
      <div className="pt-8 pb-12 px-6">
        <div className="grid grid-cols-3 gap-12 max-w-7xl">
          {/* LEFT COLUMN - Bucket Summary */}
          <div className="col-span-1 space-y-8">
            {/* Bucket Name */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{bucket.name}</h1>
            </div>

            {/* Type */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Type
              </p>
              <p className="text-sm text-foreground">{bucket.type}</p>
            </div>

            {/* Current Balance - Prominent */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Current Balance
              </p>
              <p className="text-4xl font-bold text-primary">₹{bucket.currentBalance.toLocaleString()}</p>
            </div>

            {/* Monthly Target */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Monthly Target
              </p>
              <p className="text-sm text-foreground">₹{bucket.monthlyTarget.toLocaleString()}</p>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Status
              </p>
              <p className={`text-sm font-medium ${getStatusColor(bucket.status)}`}>
                {getStatusLabel(bucket.status)}
              </p>
            </div>

            {/* Allocation Rule */}
            <div className="border-t border-border pt-8">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Why This Bucket Exists
              </p>
              <p className="text-sm text-foreground leading-relaxed">{bucket.allocationRule}</p>
            </div>
          </div>

          {/* RIGHT COLUMN - Assigned Transactions */}
          <div className="col-span-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Transactions Contributing to This Bucket
              </p>

              {/* Transaction Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Headers */}
                <div className="bg-muted/30 px-4 py-3 flex items-center gap-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="w-20 flex-shrink-0">Date</div>
                  <div className="flex-1 min-w-0">Description</div>
                  <div className="w-28 flex-shrink-0 text-right">Amount</div>
                  <div className="w-20 flex-shrink-0">Source</div>
                </div>

                {/* Rows */}
                {bucket.transactions.map((txn, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex items-center gap-4 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-20 flex-shrink-0">
                      <p className="text-sm text-muted-foreground">{txn.date}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{txn.description}</p>
                    </div>
                    <div className="w-28 flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-foreground">₹{txn.amount.toLocaleString()}</p>
                    </div>
                    <div className="w-20 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{txn.source}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* View in Inbox Link */}
              <div className="mt-6">
                <button className="text-sm text-primary hover:underline font-medium">
                  View in Inbox →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
