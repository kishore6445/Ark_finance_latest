'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, ArrowRight, Building2, CreditCard, AlertCircle, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { useAppState, type BankAccount } from '@/context/app-state';
import { useOrganization } from '@/context/organization-context';
import { getSupabaseClient } from '@/lib/supabase/client';

type BankAccountRow = {
  id: string;
  organization_id: string;
  account_name: string;
  account_number: string;
  account_type: BankAccount['accountType'] | null;
  bank_name: string | null;
  ifsc_code: string | null;
  balance: number | null;
  is_primary: boolean | null;
  status: BankAccount['status'] | null;
  created_at: string | null;
};

type BankAccountFormData = {
  accountName: string;
  accountNumber: string;
  accountType: BankAccount['accountType'];
  bankName: string;
  ifscCode: string;
  balance: number;
  isPrimary: boolean;
};

type BucketRow = {
  id: string;
  name: string | null;
  type?: 'Operating' | 'Reserve' | 'Liability' | 'Owner' | null;
  bucket_type?: 'Operating' | 'Reserve' | 'Liability' | 'Owner' | null;
};

const mapBankAccountRow = (row: BankAccountRow): BankAccount => ({
  id: row.id,
  organizationId: row.organization_id,
  accountName: row.account_name,
  accountNumber: row.account_number,
  accountType: row.account_type ?? 'Savings',
  bankName: row.bank_name ?? '',
  ifscCode: row.ifsc_code ?? '',
  balance: row.balance ?? 0,
  linkedBuckets: [],
  isPrimary: Boolean(row.is_primary),
  createdDate: row.created_at ?? new Date().toISOString(),
  status: row.status ?? 'Active',
});

async function getAccessToken() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Missing session token. Please sign in again.');
  }

  return accessToken;
}

export function BankManagementScreen() {
  const { state, linkBucketToAccount, deleteBankAccountMapping, createInterAccountTransfer } = useAppState();
  const { currentOrganization } = useOrganization();
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    description: '',
  });
  const [formData, setFormData] = useState<BankAccountFormData>({
    accountName: '',
    accountNumber: '',
    accountType: 'Savings' as const,
    bankName: '',
    ifscCode: '',
    balance: 0,
    isPrimary: false,
  });
  const [mappingForm, setMappingForm] = useState({
    bucketId: '',
    bankAccountId: '',
    allocationPercentage: 100,
    isAutomatic: false,
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [buckets, setBuckets] = useState<BucketRow[]>([]);
  const [effectiveOrganizationId, setEffectiveOrganizationId] = useState<string | null>(null);
  const [isResolvingOrganization, setIsResolvingOrganization] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveOrganizationId = async () => {
      setIsResolvingOrganization(true);

      if (currentOrganization?.id) {
        if (isMounted) {
          setEffectiveOrganizationId(currentOrganization.id);
          setIsResolvingOrganization(false);
        }
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw new Error(sessionError.message);
        }

        const userId = sessionData.session?.user?.id;
        if (!userId) {
          if (isMounted) {
            setEffectiveOrganizationId(null);
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (isMounted) {
          setEffectiveOrganizationId(profile?.organization_id ?? null);
        }
      } catch (err: any) {
        if (isMounted) {
          setEffectiveOrganizationId(null);
          setError(err?.message ?? 'Unable to resolve organization for this account.');
        }
      } finally {
        if (isMounted) {
          setIsResolvingOrganization(false);
        }
      }
    };

    void resolveOrganizationId();

    return () => {
      isMounted = false;
    };
  }, [currentOrganization]);

  const fetchBankAccounts = useCallback(async () => {
    if (!effectiveOrganizationId) {
      setBankAccounts([]);
      return;
    }

    setIsLoadingAccounts(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/bank-accounts', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to load bank accounts.');
      }

      setBankAccounts(((result.accounts ?? []) as BankAccountRow[]).map(mapBankAccountRow));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load bank accounts.');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [effectiveOrganizationId]);

  useEffect(() => {
    void fetchBankAccounts();
  }, [fetchBankAccounts]);

  const fetchBuckets = useCallback(async () => {
    if (!effectiveOrganizationId) {
      setBuckets([]);
      return;
    }

    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/buckets', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to load buckets.');
      }

      setBuckets((result.buckets ?? []) as BucketRow[]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load buckets.');
      setBuckets([]);
    }
  }, [effectiveOrganizationId]);

  useEffect(() => {
    void fetchBuckets();
  }, [fetchBuckets]);

  const handleAddBank = async () => {
    if (!effectiveOrganizationId || !formData.accountName.trim() || !formData.accountNumber.trim()) {
      return;
    }

    setIsCreatingAccount(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
          bankName: formData.bankName,
          ifscCode: formData.ifscCode,
          balance: formData.balance,
          isPrimary: formData.isPrimary,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to add bank account.');
      }

      setBankAccounts((prev) => [mapBankAccountRow(result.account as BankAccountRow), ...prev]);
      setFormData({
        accountName: '',
        accountNumber: '',
        accountType: 'Savings',
        bankName: '',
        ifscCode: '',
        balance: 0,
        isPrimary: false,
      });
      setShowAddBank(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add bank account.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleDeleteBankAccount = async (accountId: string) => {
    try {
      setError(null);
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/bank-accounts?id=${encodeURIComponent(accountId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to delete bank account.');
      }
      setBankAccounts((prev) => prev.filter((account) => account.id !== accountId));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete bank account.');
    }
  };

  const handleAddMapping = () => {
    if (mappingForm.bucketId && mappingForm.bankAccountId) {
      linkBucketToAccount({
        bucketId: mappingForm.bucketId,
        bankAccountId: mappingForm.bankAccountId,
        allocationPercentage: mappingForm.allocationPercentage,
        isAutomatic: mappingForm.isAutomatic,
      });
      setMappingForm({
        bucketId: '',
        bankAccountId: '',
        allocationPercentage: 100,
        isAutomatic: false,
      });
      setShowAddMapping(false);
    }
  };

  const handleTransfer = () => {
    if (transferForm.fromAccountId && transferForm.toAccountId && transferForm.amount > 0) {
      createInterAccountTransfer({
        fromAccountId: transferForm.fromAccountId,
        toAccountId: transferForm.toAccountId,
        amount: transferForm.amount,
        date: new Date().toISOString().split('T')[0],
        description: transferForm.description,
        status: 'Pending',
        referenceNo: `TRF-${Date.now()}`,
      });
      setTransferForm({
        fromAccountId: '',
        toAccountId: '',
        amount: 0,
        description: '',
      });
      setShowTransferModal(false);
    }
  };

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const getAccountHealth = (account: BankAccount) => {
    if (account.balance > 500000) return { status: 'Healthy', color: 'text-green-600', bg: 'bg-green-50' };
    if (account.balance > 100000) return { status: 'Adequate', color: 'text-blue-600', bg: 'bg-blue-50' };
    return { status: 'Low', color: 'text-orange-600', bg: 'bg-orange-50' };
  };

  const getBucketName = (bucketId: string) => {
    return buckets.find((bucket) => bucket.id === bucketId)?.name || bucketId;
  };

  const formatCreatedDate = (createdDate: string) => {
    const date = new Date(createdDate);
    if (Number.isNaN(date.getTime())) {
      return createdDate;
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getAllocationAmount = (balance: number, allocationPercentage: number) => {
    return (Number(balance ?? 0) * allocationPercentage) / 100;
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Accounts</h1>
          <p className="text-muted-foreground">Manage your bank accounts and bucket allocations</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
          >
            <ArrowRightLeft size={18} /> Transfer
          </button>
          <button
            onClick={() => setShowAddBank(true)}
            disabled={isResolvingOrganization || !effectiveOrganizationId}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> Add Account
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border border-primary/20">
        <p className="text-sm text-muted-foreground mb-2">Total Cash Balance Across All Accounts</p>
        <p className="text-4xl font-bold text-foreground">₹{totalBalance.toLocaleString('en-IN')}</p>
        <div className="flex gap-4 mt-4 flex-wrap">
          {bankAccounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getAccountHealth(acc).color.replace('text', 'bg')}`} />
              <span className="text-xs text-muted-foreground">{acc.accountName}: ₹{acc.balance.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>

      {showAddBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Bank Account</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Account Name</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., GST Account"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="1234567890"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., ICICI Bank"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="ICIC0000001"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value as BankAccount['accountType'] })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option>Savings</option>
                  <option>Current</option>
                  <option>Overdraft</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Opening Balance</label>
                <input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Set as Primary Account</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddBank(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                disabled={isCreatingAccount}
              >
                Cancel
              </button>
              <button
                onClick={handleAddBank}
                disabled={isCreatingAccount || !formData.accountName.trim() || !formData.accountNumber.trim() || !effectiveOrganizationId}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingAccount ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Your Bank Accounts</h2>
        {isResolvingOrganization || isLoadingAccounts ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
            {isResolvingOrganization ? 'Resolving organization...' : 'Loading bank accounts...'}
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <Building2 size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              {effectiveOrganizationId ? 'No bank accounts yet. Add one to get started.' : 'No organization linked to this account.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bankAccounts.map((account) => {
              const health = getAccountHealth(account);
              const linkedMappings = state.bankAccountMappings.filter((m) => m.bankAccountId === account.id);

              return (
                <div key={account.id} className={`border border-border rounded-lg p-6 ${health.bg} transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CreditCard size={24} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{account.accountName}</h3>
                          {account.isPrimary && <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">Primary</span>}
                          <span className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${
                            health.status === 'Healthy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            health.status === 'Adequate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {health.status === 'Healthy' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {health.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{account.bankName}</p>
                        <p className="text-xs text-muted-foreground mt-1">•••• {account.accountNumber.slice(-4)} • {account.accountType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-bold text-2xl text-foreground">₹{account.balance.toLocaleString('en-IN')}</p>
                      <div className="flex gap-2 mt-2 justify-end">
                        <button
                          onClick={() => void handleDeleteBankAccount(account.id)}
                          className="p-2 hover:bg-destructive/10 rounded text-destructive text-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {linkedMappings.length > 0 && (
                    <div className="border-t border-border/50 pt-3 mt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Linked Buckets:</p>
                      <div className="flex flex-wrap gap-2">
                        {linkedMappings.map((mapping) => (
                          <div key={mapping.id} className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded text-xs">
                            <span className="font-medium text-foreground">{getBucketName(mapping.bucketId)}</span>
                            <span className="text-muted-foreground">Allocated: {mapping.allocationPercentage}%</span>
                            <span className="font-medium text-primary">Amount: ₹{Math.round(getAllocationAmount(account.balance, mapping.allocationPercentage)).toLocaleString('en-IN')}</span>
                            <span className="text-muted-foreground">Bank Total: ₹{Math.round(account.balance).toLocaleString('en-IN')}</span>
                            {mapping.isAutomatic && <span className="text-accent ml-1">Auto</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Bucket Allocations</h2>
            <p className="text-muted-foreground text-sm">Assign buckets to bank accounts</p>
          </div>
          <button
            onClick={() => setShowAddMapping(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90"
          >
            <Plus size={18} /> Add Allocation
          </button>
        </div>

        {showAddMapping && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create Bucket Allocation</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Bucket Name</label>
                  <select
                    value={mappingForm.bucketId}
                    onChange={(e) => setMappingForm({ ...mappingForm, bucketId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
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
                  <label className="text-sm font-medium">Bank Account</label>
                  <select
                    value={mappingForm.bankAccountId}
                    onChange={(e) => setMappingForm({ ...mappingForm, bankAccountId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Account</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} (•••• {acc.accountNumber.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Allocation %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={mappingForm.allocationPercentage}
                    onChange={(e) => setMappingForm({ ...mappingForm, allocationPercentage: Number.parseInt(e.target.value, 10) || 100 })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mappingForm.isAutomatic}
                    onChange={(e) => setMappingForm({ ...mappingForm, isAutomatic: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Auto-transfer funds</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMapping(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMapping}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90"
                >
                  Add Allocation
                </button>
              </div>
            </div>
          </div>
        )}

        {state.bankAccountMappings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <ArrowRight size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No allocations yet. Create one to link buckets to accounts.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {state.bankAccountMappings.map((mapping) => {
              const account = bankAccounts.find((a) => a.id === mapping.bankAccountId);
              return (
                <div key={mapping.id} className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm">{getBucketName(mapping.bucketId)}</p>
                      <p className="text-xs text-muted-foreground">Created {formatCreatedDate(mapping.createdDate)}</p>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">{account?.accountName}</p>
                      <div className="text-xs mt-1 space-y-0.5">
                        <p className="text-muted-foreground">Amount Allocated for {getBucketName(mapping.bucketId)}: {mapping.allocationPercentage}%</p>
                        <p className="font-semibold text-primary">
                          Amount Allocated: ₹{Math.round(getAllocationAmount(account?.balance ?? 0, mapping.allocationPercentage)).toLocaleString('en-IN')}
                        </p>
                        <p className="text-muted-foreground">
                          Total Bank Amount: ₹{Math.round(account?.balance ?? 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mapping.isAutomatic && <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">Auto</span>}
                    <button
                      onClick={() => deleteBankAccountMapping(mapping.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Transfer Between Accounts</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">From Account</label>
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Account</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} (₹{acc.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">To Account</label>
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Account</option>
                  {bankAccounts.filter((acc) => acc.id !== transferForm.fromAccountId).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} (₹{acc.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  placeholder="e.g., GST Payment Transfer"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Create Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {state.interAccountTransfers.length > 0 && (
        <div className="border-t border-border pt-8">
          <h2 className="text-xl font-bold mb-4">Recent Transfers</h2>
          <div className="space-y-2">
            {state.interAccountTransfers.slice(-5).map((transfer) => {
              const fromAcc = bankAccounts.find((a) => a.id === transfer.fromAccountId);
              const toAcc = bankAccounts.find((a) => a.id === transfer.toAccountId);
              return (
                <div key={transfer.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <ArrowRightLeft size={16} className="text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{transfer.description}</p>
                      <p className="text-xs text-muted-foreground">{fromAcc?.accountName} → {toAcc?.accountName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{transfer.amount.toLocaleString('en-IN')}</p>
                    <p className={`text-xs font-medium ${
                      transfer.status === 'Completed' ? 'text-green-600' :
                      transfer.status === 'Pending' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{transfer.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
