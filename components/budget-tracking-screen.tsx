'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, TrendingUp, Target, X, DollarSign, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Budget {
  id: string;
  name: string;
  category: string;
  budgetedAmount: number;
  actualSpent: number;
  period: 'Monthly' | 'Quarterly' | 'Annually';
  startDate: string;
  endDate: string;
  owner: string;
  status: 'On Track' | 'At Risk' | 'Exceeded';
  notes?: string;
}

export function BudgetTrackingScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Budget>>({});

  const stats = {
    totalBudget: budgets.reduce((sum, b) => sum + b.budgetedAmount, 0),
    totalSpent: budgets.reduce((sum, b) => sum + b.actualSpent, 0),
    onTrack: budgets.filter((b) => b.status === 'On Track').length,
    atRisk: budgets.filter((b) => b.status === 'At Risk').length,
    exceeded: budgets.filter((b) => b.status === 'Exceeded').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'text-green-600 bg-green-50';
      case 'At Risk':
        return 'text-yellow-600 bg-yellow-50';
      case 'Exceeded':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'On Track':
        return <TrendingUp size={16} />;
      case 'At Risk':
        return <AlertTriangle size={16} />;
      case 'Exceeded':
        return <Zap size={16} />;
      default:
        return null;
    }
  };

  const getProgress = (spent: number, budgeted: number) => {
    return Math.min((spent / budgeted) * 100, 100);
  };

  const handleSaveBudget = () => {
    if (!formData.name || !formData.budgetedAmount) return;

    if (selectedId) {
      setBudgets(
        budgets.map((b) =>
          b.id === selectedId ? { ...b, ...formData } : b
        )
      );
    } else {
      setBudgets([
        ...budgets,
        {
          id: `b${Date.now()}`,
          name: formData.name || '',
          category: formData.category || '',
          budgetedAmount: formData.budgetedAmount || 0,
          actualSpent: formData.actualSpent || 0,
          period: formData.period || 'Monthly',
          startDate: formData.startDate || '',
          endDate: formData.endDate || '',
          owner: formData.owner || '',
          status: 'On Track',
          notes: formData.notes,
        },
      ]);
    }

    setFormData({});
    setSelectedId(null);
    setShowForm(false);
  };

  const deleteBudget = (id: string) => {
    setBudgets(budgets.filter((b) => b.id !== id));
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Budget Tracking</h1>
              <p className="text-sm text-muted-foreground mt-1">Monitor departmental budgets and spending</p>
            </div>
            <Button onClick={() => {
              setFormData({});
              setSelectedId(null);
              setShowForm(true);
            }} className="flex items-center gap-2">
              <Plus size={16} />
              New Budget
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <Card className="p-6 border border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total Budgeted</div>
            <div className="text-3xl font-semibold text-foreground">₹{stats.totalBudget.toLocaleString('en-IN')}</div>
          </Card>
          <Card className="p-6 border border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total Spent</div>
            <div className="text-3xl font-semibold text-red-600">₹{stats.totalSpent.toLocaleString('en-IN')}</div>
          </Card>
          <Card className="p-6 border border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">On Track</div>
            <div className="text-3xl font-semibold text-green-600">{stats.onTrack}</div>
          </Card>
          <Card className="p-6 border border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">At Risk</div>
            <div className="text-3xl font-semibold text-yellow-600">{stats.atRisk}</div>
          </Card>
          <Card className="p-6 border border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Exceeded</div>
            <div className="text-3xl font-semibold text-red-600">{stats.exceeded}</div>
          </Card>
        </div>

        {/* Budgets List */}
        <div className="space-y-4">
          {budgets.length === 0 && (
            <Card className="p-10 border border-border text-center">
              <p className="text-sm text-muted-foreground">No budgets found. Create your first budget to start tracking.</p>
            </Card>
          )}
          {budgets.map((budget) => {
            const progress = getProgress(budget.actualSpent, budget.budgetedAmount);
            const remaining = budget.budgetedAmount - budget.actualSpent;

            return (
              <div key={budget.id} className="border border-border rounded-lg p-6 hover:bg-muted/20 transition-colors">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-6 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{budget.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(budget.status)}`}>
                        {getStatusIcon(budget.status)}
                        {budget.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      <span>{budget.category}</span>
                      <span>•</span>
                      <span>{budget.period}</span>
                      <span>•</span>
                      <span>Owner: {budget.owner}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-semibold text-foreground mb-1">
                      {progress.toFixed(0)}%
                    </div>
                    <div className={`text-sm font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remaining < 0 ? 'Over' : 'Remaining'}: ₹{Math.abs(remaining).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">Spent: ₹{budget.actualSpent.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-muted-foreground">Budgeted: ₹{budget.budgetedAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        progress <= 75
                          ? 'bg-green-500'
                          : progress <= 100
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Notes and Actions */}
                <div className="flex items-end justify-between">
                  {budget.notes && (
                    <p className="text-xs text-muted-foreground italic">{budget.notes}</p>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => {
                        setFormData(budget);
                        setSelectedId(budget.id);
                        setShowForm(true);
                      }}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                {selectedId ? 'Edit Budget' : 'Create Budget'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedId(null);
                  setFormData({});
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Budget Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="e.g., Salaries & Payroll"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Payroll, Technology, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Budgeted Amount *</label>
                  <input
                    type="number"
                    value={formData.budgetedAmount || ''}
                    onChange={(e) => setFormData({ ...formData, budgetedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Actual Spent</label>
                  <input
                    type="number"
                    value={formData.actualSpent || ''}
                    onChange={(e) => setFormData({ ...formData, actualSpent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Period</label>
                  <select
                    value={formData.period || 'Monthly'}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annually</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Owner</label>
                  <input
                    type="text"
                    value={formData.owner || ''}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Department or person"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Start Date</label>
                  <input
                    type="text"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Feb 1, 2024"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">End Date</label>
                  <input
                    type="text"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Feb 29, 2024"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={3}
                  placeholder="Add any notes about this budget"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowForm(false);
                  setSelectedId(null);
                  setFormData({});
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveBudget}>
                {selectedId ? 'Update Budget' : 'Create Budget'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
