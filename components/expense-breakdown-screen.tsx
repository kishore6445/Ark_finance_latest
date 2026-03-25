'use client';

import { useState } from 'react';
import { ArrowLeft, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DateRangeFilter, type DateRange } from './date-range-filter';

interface ExpenseCategory {
  id: string;
  category: string;
  amount: number;
  percentage: number;
  trend: number;
  color: string;
  budget?: number;
}

interface ExpenseBreakdownScreenProps {
  onNavigate?: (screen: string) => void;
}

export function ExpenseBreakdownScreen({ onNavigate }: ExpenseBreakdownScreenProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: '2024-01-01',
    end: '2024-02-05',
  });

  const expenseCategories: ExpenseCategory[] = [
    {
      id: '1',
      category: 'Salaries & Payroll',
      amount: 450000,
      percentage: 42,
      trend: 0,
      color: 'bg-red-500',
      budget: 450000,
    },
    {
      id: '2',
      category: 'Infrastructure & Tools',
      amount: 150000,
      percentage: 14,
      trend: 3,
      color: 'bg-orange-500',
      budget: 140000,
    },
    {
      id: '3',
      category: 'Marketing & Advertising',
      amount: 200000,
      percentage: 18,
      trend: 8,
      color: 'bg-amber-500',
      budget: 180000,
    },
    {
      id: '4',
      category: 'Operations & Rent',
      amount: 120000,
      percentage: 11,
      trend: 0,
      color: 'bg-yellow-500',
      budget: 120000,
    },
    {
      id: '5',
      category: 'Travel & Logistics',
      amount: 80000,
      percentage: 8,
      trend: -5,
      color: 'bg-blue-500',
      budget: 100000,
    },
    {
      id: '6',
      category: 'Other Expenses',
      amount: 50000,
      percentage: 7,
      trend: 2,
      color: 'bg-slate-500',
      budget: 60000,
    },
  ];

  const totalExpenses = expenseCategories.reduce((sum, item) => sum + item.amount, 0);
  const totalBudget = expenseCategories.reduce((sum, item) => sum + (item.budget || 0), 0);
  const budgetVariance = totalBudget - totalExpenses;
  const previousExpenses = totalExpenses * 0.95;
  const expenseGrowth = ((totalExpenses - previousExpenses) / previousExpenses * 100).toFixed(1);

  const overBudget = expenseCategories.filter(cat => cat.amount > (cat.budget || 0));

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
              <h1 className="text-2xl font-bold text-foreground">Expense Breakdown</h1>
              <p className="text-sm text-muted-foreground mt-1">Detailed analysis of spending by category</p>
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
            <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
            <p className="text-3xl font-bold text-foreground mb-2">₹{(totalExpenses / 100000).toFixed(1)}L</p>
            <p className={`text-xs font-medium ${parseFloat(expenseGrowth) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {parseFloat(expenseGrowth) > 0 ? '+' : ''}{expenseGrowth}% vs last period
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Budget Remaining</p>
            <p className="text-3xl font-bold text-foreground mb-2">₹{(budgetVariance / 100000).toFixed(1)}L</p>
            <p className={`text-xs font-medium ${budgetVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {budgetVariance >= 0 ? 'Under' : 'Over'} budget
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Largest Category</p>
            <p className="text-3xl font-bold text-foreground mb-2">Salaries</p>
            <p className="text-xs text-muted-foreground">42% of total spend</p>
          </Card>

          <Card className="p-6 border-red-200 bg-red-50">
            <p className="text-sm text-red-700 font-medium mb-2">Categories Over Budget</p>
            <p className="text-3xl font-bold text-red-600 mb-2">{overBudget.length}</p>
            <p className="text-xs text-red-700">Action needed</p>
          </Card>
        </div>

        {/* Budget vs Actual */}
        <Card className="p-8 mb-12">
          <h2 className="text-lg font-bold text-foreground mb-8">Budget vs Actual Spending</h2>
          
          <div className="space-y-6">
            {expenseCategories.map((category) => {
              const isOverBudget = category.amount > (category.budget || 0);
              const variance = category.amount - (category.budget || 0);
              const variancePercent = ((variance / (category.budget || 1)) * 100).toFixed(0);

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{category.category}</p>
                      <p className="text-sm text-muted-foreground">
                        Actual: ₹{(category.amount / 100000).toFixed(1)}L | Budget: ₹{((category.budget || 0) / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isOverBudget ? '+' : '-'}₹{(Math.abs(variance) / 100000).toFixed(1)}L
                      </p>
                      <p className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isOverBudget ? '+' : ''}{variancePercent}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`${category.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min((category.amount / (category.budget || category.amount)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Alerts & Recommendations */}
        <Card className="p-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Recommendations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {overBudget.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-3">Over Budget Categories</h3>
                <ul className="space-y-2">
                  {overBudget.map(cat => (
                    <li key={cat.id} className="text-sm text-red-800">
                      • {cat.category}: +₹{((cat.amount - (cat.budget || 0)) / 100000).toFixed(1)}L
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="font-medium text-emerald-900 mb-3">Cost Savings Opportunities</h3>
              <ul className="space-y-2 text-sm text-emerald-800">
                <li>• Review marketing spend - highest growth trend</li>
                <li>• Travel costs have decreased 5% - maintain this momentum</li>
                <li>• Infrastructure costs trending up - monitor tool usage</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
