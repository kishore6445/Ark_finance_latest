'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AllocationRule {
  id: string;
  type: string;
  subtype: string;
  percentage: number;
}

interface BucketAllocationRulesProps {
  bucketId: string;
  onBack: () => void;
}

const typeOptions = ['Revenue', 'Expense', 'Asset', 'Liability'];
const subtypesByType: Record<string, string[]> = {
  Revenue: ['Sales', 'Service Income', 'Investment Returns', 'Other Income'],
  Expense: ['Operating', 'COGS', 'Travel', 'Utilities', 'Salaries', 'Other'],
  Asset: ['Cash', 'Inventory', 'Equipment', 'Other'],
  Liability: ['Accounts Payable', 'Loans', 'GST Payable', 'Other'],
};

// Sample bucket data
const bucketData: Record<string, { name: string; currentBalance: number }> = {
  '1': { name: 'Operations', currentBalance: 145000 },
  '2': { name: 'Emergency Reserve', currentBalance: 245000 },
  '3': { name: 'Tax Liability', currentBalance: 67500 },
  '4': { name: 'Owner Distributions', currentBalance: 95000 },
  '5': { name: 'Growth Fund', currentBalance: 180000 },
};

// Sample recent transactions for preview
const sampleRecentTransactions = [
  { date: 'Feb 4', description: 'Acme Studios - Project Delivery', type: 'Revenue', subtype: 'Sales', amount: 45000 },
  { date: 'Feb 3', description: 'AWS Services - Monthly Bill', type: 'Expense', subtype: 'Operating', amount: 8500 },
  { date: 'Feb 3', description: 'Salary - Priya Sharma', type: 'Expense', subtype: 'Salaries', amount: 65000 },
];

export function BucketAllocationRules({ bucketId, onBack }: BucketAllocationRulesProps) {
  const bucket = bucketData[bucketId] || { name: 'Unknown', currentBalance: 0 };
  
  const [rules, setRules] = useState<AllocationRule[]>([
    { id: '1', type: 'Revenue', subtype: 'Sales', percentage: 25 },
    { id: '2', type: 'Revenue', subtype: 'Service Income', percentage: 15 },
  ]);

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AllocationRule> | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const totalPercentage = rules.reduce((sum, rule) => sum + rule.percentage, 0);
  const isValid = totalPercentage === 100;

  const startEditMode = (rule: AllocationRule) => {
    setEditingRuleId(rule.id);
    setEditFormData({ ...rule });
  };

  const cancelEditMode = () => {
    setEditingRuleId(null);
    setEditFormData(null);
  };

  const saveRule = () => {
    if (editingRuleId && editFormData) {
      setRules(rules.map(r => (r.id === editingRuleId ? { ...r, ...editFormData } : r)));
      cancelEditMode();
    }
  };

  const addRule = () => {
    const newRule: AllocationRule = {
      id: `rule-${Date.now()}`,
      type: 'Revenue',
      subtype: 'Sales',
      percentage: 0,
    };
    setRules([...rules, newRule]);
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const saveAllRules = () => {
    if (!isValid) return;
    setShowConfirmation(true);
  };

  const confirmSave = () => {
    setShowConfirmation(false);
    // In a real app, this would persist to the database
    alert('Allocation rules saved! These will apply to future transactions only.');
  };

  // Calculate preview allocation
  const calculatePreviewAllocation = () => {
    return sampleRecentTransactions.map(txn => {
      const matchingRule = rules.find(r => r.type === txn.type && r.subtype === txn.subtype);
      const allocated = matchingRule ? (txn.amount * matchingRule.percentage) / 100 : 0;
      return {
        ...txn,
        allocation: allocated,
      };
    });
  };

  const previewData = calculatePreviewAllocation();
  const totalPreviewAllocation = previewData.reduce((sum, t) => sum + t.allocation, 0);

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
        <p className="text-muted-foreground text-sm">Configure how money flows into this bucket</p>
      </div>

      {/* Two-Column Layout */}
      <div className="pt-8 pb-12 px-6">
        <div className="grid grid-cols-3 gap-12 max-w-7xl">
          {/* LEFT COLUMN - Rules Editor */}
          <div className="col-span-1 space-y-6">
            {/* Bucket Name */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{bucket.name}</h1>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
                Current Balance
              </p>
              <p className="text-2xl font-bold text-primary">₹{bucket.currentBalance.toLocaleString()}</p>
            </div>

            {/* Rules List */}
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allocation Rules</p>
                <button
                  onClick={addRule}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus size={14} />
                  Add Rule
                </button>
              </div>

              {rules.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No rules defined yet. Add one to get started.</p>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className={`border rounded-lg p-3 space-y-2 ${editingRuleId === rule.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      {editingRuleId === rule.id && editFormData ? (
                        <>
                          {/* Type Select */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Type</label>
                            <select
                              value={editFormData.type || 'Revenue'}
                              onChange={(e) => {
                                const newType = e.target.value;
                                setEditFormData({ ...editFormData, type: newType, subtype: subtypesByType[newType]?.[0] || '' });
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-border rounded bg-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            >
                              {typeOptions.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>

                          {/* Subtype Select */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Subtype</label>
                            <select
                              value={editFormData.subtype || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, subtype: e.target.value })}
                              className="w-full px-2 py-1.5 text-xs border border-border rounded bg-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            >
                              {(subtypesByType[editFormData.type || 'Revenue'] || []).map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Percentage Input */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Allocation %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editFormData.percentage || 0}
                              onChange={(e) => setEditFormData({ ...editFormData, percentage: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 text-xs border border-border rounded bg-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                          </div>

                          {/* Save/Cancel */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={saveRule}
                              className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditMode}
                              className="flex-1 px-2 py-1.5 text-xs font-medium text-foreground border border-border rounded hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {rule.type} → {rule.subtype}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {rule.percentage}% of matching transactions
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => startEditMode(rule)}
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/40 rounded"
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M1 13L3 6L11 1L13 3L8 11L1 13Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteRule(rule.id)}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors hover:bg-destructive/10 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Total Percentage Indicator */}
              <div className={`border rounded-lg p-3 space-y-2 ${isValid ? 'border-accent bg-accent/5' : 'border-warning bg-warning/5'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">Total Allocation</p>
                  <p className={`text-sm font-bold ${isValid ? 'text-accent' : 'text-warning'}`}>{totalPercentage}%</p>
                </div>
                {!isValid && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle size={12} />
                    Must equal 100%
                  </p>
                )}
              </div>

              {/* Save Button */}
              <Button
                onClick={saveAllRules}
                disabled={!isValid}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Rules
              </Button>

              {/* Safety Note */}
              <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                These rules apply to <strong>future transactions only</strong>. Existing allocations won't change retroactively.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN - Live Preview */}
          <div className="col-span-2">
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Live Preview (Last 30 Days)
              </p>

              <div className="border border-border rounded-lg overflow-hidden">
                {/* Headers */}
                <div className="bg-muted/30 px-4 py-3 flex items-center gap-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="w-20 flex-shrink-0">Date</div>
                  <div className="flex-1 min-w-0">Description</div>
                  <div className="w-28 flex-shrink-0 text-right">Amount</div>
                  <div className="w-28 flex-shrink-0 text-right">Allocation</div>
                </div>

                {/* Rows */}
                {previewData.map((txn, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex items-center gap-4 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-20 flex-shrink-0">
                      <p className="text-sm text-muted-foreground">{txn.date}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{txn.type} • {txn.subtype}</p>
                    </div>
                    <div className="w-28 flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-foreground">₹{txn.amount.toLocaleString()}</p>
                    </div>
                    <div className="w-28 flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-accent">₹{Math.round(txn.allocation).toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                {/* Summary Row */}
                <div className="bg-muted/10 px-4 py-3 flex items-center gap-4 border-t border-border font-semibold">
                  <div className="w-20 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0 text-sm">
                    Total Allocated
                  </div>
                  <div className="w-28 flex-shrink-0 text-right">
                    <p className="text-sm text-foreground">₹{sampleRecentTransactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="w-28 flex-shrink-0 text-right">
                    <p className="text-sm text-accent font-bold">₹{Math.round(totalPreviewAllocation).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Based on recent transactions, these rules would allocate <strong>₹{Math.round(totalPreviewAllocation).toLocaleString()}</strong> to {bucket.name} this month.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full mx-4 shadow-lg">
            <div className="px-6 py-4 border-b border-border space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Confirm Rule Changes</h2>
              <p className="text-sm text-foreground">
                These new allocation rules will apply to <strong>future transactions only</strong>. Existing transactions won't be recalculated.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded transition-colors"
              >
                Cancel
              </button>
              <Button onClick={confirmSave}>
                Confirm & Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
