'use client';

import { useState } from 'react';
import { ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DateRangeFilter, type DateRange } from './date-range-filter';

interface CashFlowProjection {
  month: string;
  projected: number;
  risk: 'low' | 'medium' | 'high';
  description: string;
}

interface CashFlowProjectionScreenProps {
  onNavigate?: (screen: string) => void;
}

export function CashFlowProjectionScreen({ onNavigate }: CashFlowProjectionScreenProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: '2024-01-01',
    end: '2024-02-05',
  });

  const projections: CashFlowProjection[] = [
    {
      month: 'Feb 2024',
      projected: 245000,
      risk: 'low',
      description: 'Current month - on track',
    },
    {
      month: 'Mar 2024',
      projected: 285000,
      risk: 'low',
      description: 'Expected revenue spike from Q1 projects',
    },
    {
      month: 'Apr 2024',
      projected: 320000,
      risk: 'low',
      description: 'Seasonal peak - high customer spending',
    },
    {
      month: 'May 2024',
      projected: 180000,
      risk: 'medium',
      description: 'Post-peak decline - monitor closely',
    },
    {
      month: 'Jun 2024',
      projected: 150000,
      risk: 'high',
      description: 'Below minimum threshold - intervention needed',
    },
  ];

  const currentCash = 245000;
  const avgMonthlyBurn = 107000;
  const runwayMonths = (currentCash / avgMonthlyBurn).toFixed(1);

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return 'bg-emerald-100 border-emerald-300 text-emerald-900';
      case 'medium':
        return 'bg-amber-100 border-amber-300 text-amber-900';
      case 'high':
        return 'bg-red-100 border-red-300 text-red-900';
    }
  };

  const getRiskBadgeColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return 'bg-emerald-200 text-emerald-800';
      case 'medium':
        return 'bg-amber-200 text-amber-800';
      case 'high':
        return 'bg-red-200 text-red-800';
    }
  };

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
              <h1 className="text-2xl font-bold text-foreground">Cash Flow Projection</h1>
              <p className="text-sm text-muted-foreground mt-1">6-month cash position forecast</p>
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
            <p className="text-sm text-muted-foreground mb-2">Current Cash</p>
            <p className="text-3xl font-bold text-foreground mb-2">₹{(currentCash / 100000).toFixed(1)}L</p>
            <p className="text-xs text-muted-foreground">As of today</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Monthly Burn Rate</p>
            <p className="text-3xl font-bold text-foreground mb-2">₹{(avgMonthlyBurn / 100000).toFixed(1)}L</p>
            <p className="text-xs text-muted-foreground">Average monthly expenses</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Runway</p>
            <p className="text-3xl font-bold text-foreground mb-2">{runwayMonths}</p>
            <p className="text-xs text-emerald-600 font-medium">months of operations</p>
          </Card>

          <Card className="p-6 border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-700 font-medium mb-2">Alert: May Challenge</p>
            <p className="text-3xl font-bold text-amber-600 mb-2">60 days</p>
            <p className="text-xs text-amber-700">Monitor closely</p>
          </Card>
        </div>

        {/* Projection Details */}
        <Card className="p-8 mb-12">
          <h2 className="text-lg font-bold text-foreground mb-8">Monthly Cash Position</h2>
          
          <div className="space-y-4">
            {projections.map((projection, index) => (
              <div key={index} className={`border rounded-lg p-6 ${getRiskColor(projection.risk)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{projection.month}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRiskBadgeColor(projection.risk)}`}>
                        {projection.risk.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-3">{projection.description}</p>
                    <p className="text-2xl font-bold">₹{(projection.projected / 100000).toFixed(1)}L</p>
                  </div>

                  {/* Visual Indicator */}
                  <div className="ml-4">
                    {projection.risk === 'high' && (
                      <div className="p-2 bg-red-200 rounded-full">
                        <AlertCircle size={24} className="text-red-700" />
                      </div>
                    )}
                    {projection.risk === 'medium' && (
                      <div className="p-2 bg-amber-200 rounded-full">
                        <AlertCircle size={24} className="text-amber-700" />
                      </div>
                    )}
                    {projection.risk === 'low' && (
                      <div className="p-2 bg-emerald-200 rounded-full">
                        <TrendingUp size={24} className="text-emerald-700" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 border-emerald-200 bg-emerald-50">
            <h3 className="font-bold text-emerald-900 mb-4">Opportunities</h3>
            <ul className="space-y-3 text-sm text-emerald-800">
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>Capitalize on Q2 peak (Apr) - plan for increased working capital needs</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>Current runway of 2.3 months is healthy - good buffer for operations</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>Revenue growth trend supports positive cash flow through Q2</span>
              </li>
            </ul>
          </Card>

          <Card className="p-8 border-red-200 bg-red-50">
            <h3 className="font-bold text-red-900 mb-4">Action Items</h3>
            <ul className="space-y-3 text-sm text-red-800">
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>June projection below minimum - plan revenue initiatives for Q2/Q3</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>Review expense budget for May onwards - consider cost optimization</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">•</span>
                <span>Secure additional funding or reduce burn rate if June targets not met</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}
