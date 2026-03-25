'use client';

import { Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BudgetItem {
  id: string;
  bucketName: string;
  type: 'Operating' | 'Reserve' | 'Liability' | 'Owner';
  monthlyTarget: number;
  actualThisPeriod: number;
  status: 'healthy' | 'attention' | 'critical';
}

const budgetData: BudgetItem[] = [
  {
    id: '1',
    bucketName: 'Operations',
    type: 'Operating',
    monthlyTarget: 100000,
    actualThisPeriod: 92500,
    status: 'healthy',
  },
  {
    id: '2',
    bucketName: 'Emergency Reserve',
    type: 'Reserve',
    monthlyTarget: 50000,
    actualThisPeriod: 52300,
    status: 'healthy',
  },
  {
    id: '3',
    bucketName: 'Tax Liability',
    type: 'Liability',
    monthlyTarget: 35000,
    actualThisPeriod: 38200,
    status: 'attention',
  },
  {
    id: '4',
    bucketName: 'Owner Distributions',
    type: 'Owner',
    monthlyTarget: 75000,
    actualThisPeriod: 62500,
    status: 'healthy',
  },
];

export function BudgetVsActualScreen() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-accent/10 text-accent';
      case 'attention':
        return 'bg-warning/10 text-warning';
      case 'critical':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getVarianceColor = (status: string) => {
    return status === 'critical' ? 'text-destructive' : 'text-foreground';
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-6 px-8 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Navigate back to reports
                window.location.href = '#reports';
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Budget vs Actual</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Buckets are your budget intent. This shows current reality.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <Download size={16} />
            Export
          </Button>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium rounded-lg border border-primary bg-primary/10 text-primary">
            This Month
          </button>
          <button className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
            This Quarter
          </button>
          <button className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
            This Year
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0">
            <div>Bucket Name</div>
            <div>Type</div>
            <div className="text-right">Monthly Target</div>
            <div className="text-right">Actual This Period</div>
            <div className="text-right">Variance</div>
            <div>Status</div>
            <div></div>
          </div>

          {/* Rows */}
          {budgetData.map((item) => {
            const variance = item.actualThisPeriod - item.monthlyTarget;
            const isOver = variance > 0;

            return (
              <div
                key={item.id}
                onClick={() => {
                  // Navigate to bucket details
                  console.log('Viewing bucket details for:', item.bucketName);
                }}
                className="grid grid-cols-7 gap-4 px-6 py-4 border-t border-border hover:bg-muted/20 transition-colors items-center cursor-pointer group"
              >
                <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {item.bucketName}
                </div>
                <div className="text-sm text-muted-foreground">{item.type}</div>
                <div className="text-sm font-medium text-foreground text-right">
                  ₹{item.monthlyTarget.toLocaleString('en-IN')}
                </div>
                <div className="text-sm font-medium text-foreground text-right">
                  ₹{item.actualThisPeriod.toLocaleString('en-IN')}
                </div>
                <div className={`text-sm font-medium text-right ${getVarianceColor(item.status)}`}>
                  {isOver ? '+' : ''}₹{variance.toLocaleString('en-IN')}
                </div>
                <div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                  →
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-8 max-w-2xl space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            How to Read This
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${getStatusColor('healthy').split(' ')[0]} mt-1.5`} />
              <div>
                <p className="text-sm font-medium text-foreground">Healthy</p>
                <p className="text-xs text-muted-foreground">Bucket is within or above target.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${getStatusColor('attention').split(' ')[0]} mt-1.5`} />
              <div>
                <p className="text-sm font-medium text-foreground">Attention</p>
                <p className="text-xs text-muted-foreground">Bucket is 10–20% above target. Monitor next week.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${getStatusColor('critical').split(' ')[0]} mt-1.5`} />
              <div>
                <p className="text-sm font-medium text-foreground">Critical</p>
                <p className="text-xs text-muted-foreground">Bucket is 20%+ above target. Action recommended.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
