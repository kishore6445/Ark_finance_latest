'use client';

import { useState } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DateRangeFilter, type DateRange } from './date-range-filter';

interface RevenueSource {
  id: string;
  category: string;
  amount: number;
  percentage: number;
  trend: number;
  color: string;
}

interface RevenueBreakdownScreenProps {
  onNavigate?: (screen: string) => void;
}

export function RevenueBreakdownScreen({ onNavigate }: RevenueBreakdownScreenProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: '2024-01-01',
    end: '2024-02-05',
  });

  const revenueSources: RevenueSource[] = [
    {
      id: '1',
      category: 'Product Sales',
      amount: 650000,
      percentage: 59,
      trend: 12,
      color: 'bg-emerald-500',
    },
    {
      id: '2',
      category: 'Consulting Services',
      amount: 320000,
      percentage: 29,
      trend: 5,
      color: 'bg-blue-500',
    },
    {
      id: '3',
      category: 'Licensing & Fees',
      amount: 110000,
      percentage: 10,
      trend: 2,
      color: 'bg-amber-500',
    },
    {
      id: '4',
      category: 'Other Income',
      amount: 20000,
      percentage: 2,
      trend: -8,
      color: 'bg-slate-500',
    },
  ];

  const totalRevenue = revenueSources.reduce((sum, item) => sum + item.amount, 0);
  const previousRevenue = totalRevenue * 0.92; // Mock previous period
  const revenueGrowth = ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => onNavigate?.('snapshot')}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Revenue Breakdown</h1>
              <p className="text-sm text-muted-foreground mt-1">Detailed analysis of revenue sources and trends</p>
            </div>
          </div>
          
          <div className="max-w-xs">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-foreground mb-2">₹{(totalRevenue / 100000).toFixed(1)}L</p>
            <p className="text-xs text-emerald-600 font-medium">+{revenueGrowth}% vs last period</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Average Transaction</p>
            <p className="text-3xl font-bold text-foreground mb-2">₹{(totalRevenue / 150).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">150 transactions</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Largest Category</p>
            <p className="text-3xl font-bold text-foreground mb-2">Product Sales</p>
            <p className="text-xs text-muted-foreground">59% of total</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Revenue Stream Count</p>
            <p className="text-3xl font-bold text-foreground mb-2">4</p>
            <p className="text-xs text-emerald-600 font-medium">Well diversified</p>
          </Card>
        </div>

        {/* Revenue Sources */}
        <Card className="p-8 mb-12">
          <h2 className="text-lg font-bold text-foreground mb-8">Revenue by Source</h2>
          
          <div className="space-y-6">
            {revenueSources.map((source) => (
              <div key={source.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{source.category}</p>
                    <p className="text-sm text-muted-foreground">₹{(source.amount / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{source.percentage}%</p>
                    <p className={`text-sm font-medium ${source.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {source.trend >= 0 ? '+' : ''}{source.trend}% MoM
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`${source.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Trends */}
        <Card className="p-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Monthly Trends</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Top Growing Category</h3>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp size={24} className="text-emerald-600" />
                  <div>
                    <p className="font-medium text-foreground">Product Sales</p>
                    <p className="text-sm text-emerald-700">+12% growth this month</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Performance Note</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  Revenue growth is solid across most categories. Consulting services show steady performance. Consider promotional activities for "Other Income" category to boost diversification.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
