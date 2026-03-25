'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Check, Pause, Play, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'Revenue' | 'Expense';
  frequency: 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly' | 'Annually';
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  lastOccurrence?: string;
  occurrences: number;
  status: 'Active' | 'Paused' | 'Completed';
  accountingType: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  subtype: string;
  notes?: string;
  autoApply: boolean;
}

export function RecurringTransactionsScreen() {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<RecurringTransaction>>({
    frequency: 'Monthly',
    status: 'Active',
    type: 'Expense',
    autoApply: true,
  });

  const filteredTransactions = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subtype.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = filteredTransactions.filter((t) => t.status === 'Active').length;
  const monthlyRevenue = filteredTransactions
    .filter((t) => t.type === 'Revenue' && t.frequency === 'Monthly' && t.status === 'Active')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpense = filteredTransactions
    .filter((t) => t.type === 'Expense' && t.frequency === 'Monthly' && t.status === 'Active')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleSave = () => {
    if (!formData.description || !formData.amount) return;

    if (editingId) {
      setTransactions(
        transactions.map((t) =>
          t.id === editingId ? { ...t, ...formData } : t
        )
      );
      setEditingId(null);
    } else {
      setTransactions([
        ...transactions,
        {
          id: `r${Date.now()}`,
          description: formData.description || '',
          amount: formData.amount || 0,
          type: formData.type || 'Expense',
          frequency: formData.frequency || 'Monthly',
          startDate: formData.startDate || new Date().toISOString().split('T')[0],
          endDate: formData.endDate,
          nextDueDate: formData.nextDueDate || 'TBD',
          occurrences: 1,
          status: 'Active',
          accountingType: formData.accountingType || 'Expense',
          subtype: formData.subtype || 'Other',
          autoApply: formData.autoApply || true,
          notes: formData.notes,
        },
      ]);
    }

    setFormData({ frequency: 'Monthly', status: 'Active', type: 'Expense', autoApply: true });
    setShowForm(false);
  };

  const handleEdit = (tx: RecurringTransaction) => {
    setFormData(tx);
    setEditingId(tx.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
    setDeleteConfirmId(null);
  };

  const toggleStatus = (id: string) => {
    setTransactions(
      transactions.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'Active' ? 'Paused' : 'Active' }
          : t
      )
    );
  };

  const handleApplyNow = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      // Mock: In real app, this would create a transaction in Inbox
      setTransactions(
        transactions.map((t) =>
          t.id === id
            ? { ...t, lastOccurrence: new Date().toISOString().split('T')[0], occurrences: t.occurrences + 1 }
            : t
        )
      );
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Recurring Transactions</h1>
          <p className="text-sm text-muted-foreground">Set up salaries, subscriptions, and automatic expenses</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground font-medium mb-2">Active Templates</div>
            <div className="text-2xl font-semibold text-foreground">{activeCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground font-medium mb-2">Monthly Revenue</div>
            <div className="text-2xl font-semibold text-green-600">+₹{monthlyRevenue.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground font-medium mb-2">Monthly Expense</div>
            <div className="text-2xl font-semibold text-red-600">-₹{monthlyExpense.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground font-medium mb-2">Net Monthly Impact</div>
            <div className={`text-2xl font-semibold ${monthlyRevenue - monthlyExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyRevenue - monthlyExpense >= 0 ? '+' : ''}₹{(monthlyRevenue - monthlyExpense).toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by description or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 bg-muted border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button
            onClick={() => {
              setFormData({ frequency: 'Monthly', status: 'Active', type: 'Expense', autoApply: true });
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Create Template
          </Button>
        </div>

        {/* Transactions Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Next Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Occurrences</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Auto-Apply</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, index) => (
                  <tr key={tx.id} className={`border-b border-border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{tx.description}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${tx.type === 'Revenue' ? 'text-green-600' : 'text-foreground'}`}>
                      {tx.type === 'Revenue' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{tx.frequency}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{tx.nextDueDate}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-1">
                      <Clock size={14} />
                      {tx.occurrences}x
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        tx.autoApply
                          ? 'bg-blue-500/10 text-blue-700'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {tx.autoApply ? 'Yes' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        tx.status === 'Active'
                          ? 'bg-green-500/10 text-green-700'
                          : tx.status === 'Paused'
                            ? 'bg-yellow-500/10 text-yellow-700'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {tx.status === 'Active' && (
                          <button
                            onClick={() => handleApplyNow(tx.id)}
                            className="p-1 text-muted-foreground hover:text-accent transition-colors"
                            title="Apply Now"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => toggleStatus(tx.id)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title={tx.status === 'Active' ? 'Pause' : 'Resume'}
                        >
                          {tx.status === 'Active' ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="px-8 py-12 text-center">
              <AlertCircle size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No recurring transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {editingId ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Salary - John Doe"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
                  <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                  <select
                    value={formData.type || 'Expense'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option>Revenue</option>
                    <option>Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Frequency</label>
                  <select
                    value={formData.frequency || 'Monthly'}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option>Weekly</option>
                    <option>Biweekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annually</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.subtype || ''}
                    onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Salary, Rent, etc."
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoApply || false}
                      onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-xs font-medium text-foreground">Auto-apply to inbox</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  rows={2}
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/70 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors text-sm font-medium disabled:opacity-50"
                disabled={!formData.description || !formData.amount}
              >
                {editingId ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Delete Template?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This will stop the recurring transaction. Past occurrences will remain in the inbox.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/70 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
