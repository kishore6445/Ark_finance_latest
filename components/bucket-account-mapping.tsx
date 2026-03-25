'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppState } from '@/context/app-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

type BucketRow = {
  id: string;
  name?: string | null;
  type?: 'Operating' | 'Reserve' | 'Liability' | 'Owner' | null;
  bucket_type?: 'Operating' | 'Reserve' | 'Liability' | 'Owner' | null;
};

type BankAccountRow = {
  id: string;
  account_name?: string | null;
  account_number?: string | null;
  bank_name?: string | null;
  balance?: number | null;
};

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function BucketAccountMapping() {
  const { state, linkBucketToAccount, deleteBankAccountMapping, updateBankAccountMapping } = useAppState();
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [buckets, setBuckets] = useState<BucketRow[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([]);
  const [formData, setFormData] = useState({
    bucketId: '',
    bankAccountId: '',
    allocationPercentage: 100,
    isAutomatic: false,
  });

  const fetchOptions = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const [bucketResponse, bankAccountResponse] = await Promise.all([
        fetch('/api/buckets', { method: 'GET', headers, cache: 'no-store' }),
        fetch('/api/bank-accounts', { method: 'GET', headers, cache: 'no-store' }),
      ]);

      const bucketResult = bucketResponse.ok ? await bucketResponse.json() : { buckets: [] };
      const bankResult = bankAccountResponse.ok ? await bankAccountResponse.json() : { accounts: [] };

      setBuckets(bucketResult.buckets ?? []);
      setBankAccounts(bankResult.accounts ?? []);
    } catch (error) {
      console.error('[BucketAccountMapping] Failed to load options:', error);
      setBuckets([]);
      setBankAccounts([]);
    }
  }, []);

  useEffect(() => {
    void fetchOptions();
  }, [fetchOptions]);

  const handleAddMapping = () => {
    if (formData.bucketId && formData.bankAccountId) {
      linkBucketToAccount({
        bucketId: formData.bucketId,
        bankAccountId: formData.bankAccountId,
        allocationPercentage: formData.allocationPercentage,
        isAutomatic: formData.isAutomatic,
      });
      setFormData({
        bucketId: '',
        bankAccountId: '',
        allocationPercentage: 100,
        isAutomatic: false,
      });
      setShowAddMapping(false);
    }
  };

  const getBucketMappings = (bucketId: string) => {
    return state.bankAccountMappings.filter((m) => m.bucketId === bucketId);
  };

  const getTotalPercentage = (bucketId: string) => {
    return getBucketMappings(bucketId).reduce((sum, m) => sum + m.allocationPercentage, 0);
  };

  const getBucketName = (bucketId: string) => {
    return buckets.find((b) => b.id === bucketId)?.name || bucketId;
  };

  const getBucketColor = (bucketId: string) => {
    const bucket = buckets.find((b) => b.id === bucketId);
    const bucketType = bucket?.type ?? bucket?.bucket_type;
    switch (bucketType) {
      case 'Operating':
        return 'bg-green-100 text-green-900';
      case 'Reserve':
        return 'bg-purple-100 text-purple-900';
      case 'Liability':
        return 'bg-blue-100 text-blue-900';
      case 'Owner':
        return 'bg-orange-100 text-orange-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  const getAccountName = (accountId: string) => {
    const bankAccount = bankAccounts.find((a) => a.id === accountId);
    if (!bankAccount) return 'Unknown';
    const maskedNumber = bankAccount.account_number ? `•••• ${bankAccount.account_number.slice(-4)}` : '';
    return [bankAccount.account_name, maskedNumber].filter(Boolean).join(' • ');
  };

  const getAllocationAmount = (accountId: string, allocationPercentage: number) => {
    const bankAccount = bankAccounts.find((account) => account.id === accountId);
    const balance = Number(bankAccount?.balance ?? 0);
    return (balance * allocationPercentage) / 100;
  };

  const getBankAccountBalance = (accountId: string) => {
    const bankAccount = bankAccounts.find((account) => account.id === accountId);
    return Number(bankAccount?.balance ?? 0);
  };

  const formatCreatedDate = (createdDate: string) => {
    const date = new Date(createdDate);
    if (Number.isNaN(date.getTime())) return createdDate;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bucket Allocation</h1>
          <p className="text-muted-foreground">Define how money from each bucket flows to your bank accounts</p>
        </div>
        <Button onClick={() => setShowAddMapping(true)} className="gap-2">
          <Plus size={18} /> Add Mapping
        </Button>
      </div>

      {/* Buckets Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buckets.map((bucket) => {
          const mappings = getBucketMappings(bucket.id);
          const totalPercentage = getTotalPercentage(bucket.id);
          const isBalanced = totalPercentage === 100;

          return (
            <Card key={bucket.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getBucketColor(bucket.id)}`}>{bucket.name}</div>
                <span
                  className={`text-sm font-semibold ${isBalanced ? 'text-green-600' : totalPercentage > 100 ? 'text-red-600' : 'text-yellow-600'}`}
                >
                  {totalPercentage}%
                </span>
              </div>

              {mappings.length === 0 ? (
                <p className="text-sm text-muted-foreground mb-4">No allocations defined</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {mappings.map((mapping) => (
                    <div key={mapping.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{getAccountName(mapping.bankAccountId)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${mapping.allocationPercentage}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground">{mapping.allocationPercentage}%</span>
                        </div>
                        <div className="mt-2 space-y-1 text-xs">
                          <p className="font-semibold text-foreground">Percentage Allocated for {bucket.name}: {mapping.allocationPercentage}%</p>
                          <p className="font-semibold text-primary">
                            Amount Allocated for {bucket.name}: ₹{Math.round(getAllocationAmount(mapping.bankAccountId, mapping.allocationPercentage)).toLocaleString('en-IN')}
                          </p>
                          <p className="text-muted-foreground">
                            Total Bank Amount: ₹{Math.round(getBankAccountBalance(mapping.bankAccountId)).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Created: {formatCreatedDate(mapping.createdDate)}</p>
                        {mapping.isAutomatic && <p className="text-xs text-green-600 mt-1">Auto transfer enabled</p>}
                      </div>
                      <button
                        onClick={() => deleteBankAccountMapping(mapping.id)}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors ml-2"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {totalPercentage !== 100 && (
                <div className={`p-3 rounded-lg text-sm ${totalPercentage > 100 ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'}`}>
                  {totalPercentage > 100
                    ? `Allocation exceeds 100% by ${totalPercentage - 100}%`
                    : `Only ${totalPercentage}% allocated. Remaining: ${100 - totalPercentage}%`}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Mapping Modal */}
      {showAddMapping && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">Add Bucket Allocation</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Bucket</label>
                <select
                  value={formData.bucketId}
                  onChange={(e) => setFormData({ ...formData, bucketId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="">Select bucket</option>
                  {buckets.map((bucket) => (
                    <option key={bucket.id} value={bucket.id}>
                      {bucket.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Bank Account</label>
                <select
                  value={formData.bankAccountId}
                  onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="">Select account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name} ({account.account_number ? `•••• ${account.account_number.slice(-4)}` : 'No account number'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Allocation Percentage</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.allocationPercentage}
                    onChange={(e) => setFormData({ ...formData, allocationPercentage: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.allocationPercentage}
                    onChange={(e) => setFormData({ ...formData, allocationPercentage: parseInt(e.target.value) })}
                    className="w-16 px-3 py-2 bg-background border border-border rounded-lg text-sm text-center"
                  />
                  <span className="text-sm font-medium">%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-transfer"
                  checked={formData.isAutomatic}
                  onChange={(e) => setFormData({ ...formData, isAutomatic: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="auto-transfer" className="text-sm font-medium cursor-pointer">
                  Enable automatic transfers
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <button
                onClick={() => setShowAddMapping(false)}
                className="flex-1 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
              >
                Cancel
              </button>
              <Button
                onClick={handleAddMapping}
                disabled={!formData.bucketId || !formData.bankAccountId}
                className="flex-1"
              >
                Add Allocation
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
