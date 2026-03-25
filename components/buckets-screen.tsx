'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, Edit2, Sliders, X } from 'lucide-react';
import { BucketDetail } from '@/components/bucket-detail';
import { BucketAllocationRules } from '@/components/bucket-allocation-rules';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrganization } from '@/context/organization-context';

interface Bucket {
  id: string;
  name: string;
  type: 'Operating' | 'Reserve' | 'Liability' | 'Owner';
  currentBalance: number;
  monthlyTarget?: number;
  status: 'healthy' | 'attention' | 'critical';
}

type BucketRow = {
  id: string;
  name: string;
  type?: string | null;
  bucket_type?: string | null;
  current_balance?: number | null;
  balance?: number | null;
  monthly_target?: number | null;
  status?: string | null;
};

const mapBucketRow = (row: BucketRow): Bucket => ({
  id: row.id,
  name: row.name,
  type: (row.type ?? row.bucket_type ?? 'Operating') as Bucket['type'],
  currentBalance: row.current_balance ?? row.balance ?? 0,
  monthlyTarget: row.monthly_target ?? undefined,
  status: (row.status ?? 'healthy') as Bucket['status'],
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

export function BucketsScreen() {
  const { currentOrganization } = useOrganization();
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [showRulesEditor, setShowRulesEditor] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [newBucketData, setNewBucketData] = useState({
    name: '',
    type: 'Operating',
    monthlyTarget: '',
  });
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [isResolvingOrganization, setIsResolvingOrganization] = useState(true);
  const [effectiveOrganizationId, setEffectiveOrganizationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
            setCurrentUserId(null);
          }
          return;
        }

        if (isMounted) {
          setCurrentUserId(userId);
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
          setCurrentUserId(null);
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

  const fetchBuckets = useCallback(async () => {
    if (!effectiveOrganizationId) {
      setBuckets([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const query = new URLSearchParams({
        userId: currentUserId ?? '',
        organizationId: effectiveOrganizationId,
      });
      const response = await fetch(`/api/buckets?${query.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-access-token': accessToken,
          'x-user-id': currentUserId ?? '',
          'x-organization-id': effectiveOrganizationId,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to load buckets.');
      }

      const mapped = ((result.buckets ?? []) as BucketRow[]).map(mapBucketRow);

      setBuckets(mapped);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load buckets.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, effectiveOrganizationId]);

  useEffect(() => {
    void fetchBuckets();
  }, [fetchBuckets]);

  const resetBucketForm = () => {
    setNewBucketData({ name: '', type: 'Operating', monthlyTarget: '' });
    setEditingBucketId(null);
  };

  const handleOpenCreateModal = () => {
    resetBucketForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (bucket: Bucket) => {
    setEditingBucketId(bucket.id);
    setNewBucketData({
      name: bucket.name,
      type: bucket.type,
      monthlyTarget: bucket.monthlyTarget ? String(bucket.monthlyTarget) : '',
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    resetBucketForm();
  };

  const handleCreateBucket = async () => {
    if (!newBucketData.name.trim() || !effectiveOrganizationId) {
      return;
    }

    setCreateLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/buckets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'x-access-token': accessToken,
          'x-user-id': currentUserId ?? '',
          'x-organization-id': effectiveOrganizationId,
        },
        body: JSON.stringify({
          accessToken,
          userId: currentUserId,
          organizationId: effectiveOrganizationId,
          name: newBucketData.name,
          type: newBucketData.type,
          monthlyTarget: newBucketData.monthlyTarget ? Number.parseInt(newBucketData.monthlyTarget, 10) : null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to create bucket.');
      }

      const newBucket = mapBucketRow(result.bucket as BucketRow);

      setBuckets((prev) => [...prev, newBucket]);
      handleCloseModal();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create bucket.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateBucket = async () => {
    if (!editingBucketId || !newBucketData.name.trim() || !effectiveOrganizationId) {
      return;
    }

    setCreateLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/buckets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'x-access-token': accessToken,
          'x-user-id': currentUserId ?? '',
          'x-organization-id': effectiveOrganizationId,
        },
        body: JSON.stringify({
          accessToken,
          userId: currentUserId,
          organizationId: effectiveOrganizationId,
          id: editingBucketId,
          name: newBucketData.name,
          type: newBucketData.type,
          monthlyTarget: newBucketData.monthlyTarget ? Number.parseInt(newBucketData.monthlyTarget, 10) : null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to update bucket.');
      }

      const updatedBucket = mapBucketRow(result.bucket as BucketRow);
      setBuckets((prev) => prev.map((bucket) => (bucket.id === updatedBucket.id ? updatedBucket : bucket)));
      handleCloseModal();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update bucket.');
    } finally {
      setCreateLoading(false);
    }
  };

  if (selectedBucket) {
    return <BucketDetail bucketId={selectedBucket} onBack={() => setSelectedBucket(null)} />;
  }

  if (showRulesEditor) {
    return <BucketAllocationRules bucketId={showRulesEditor} onBack={() => setShowRulesEditor(null)} />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="pt-8 pb-4 px-6 border-b border-border flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Where your money is intentionally allocated</p>
        <button
          onClick={handleOpenCreateModal}
          disabled={isResolvingOrganization || !effectiveOrganizationId}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Bucket
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="space-y-0 border-b border-border">
          <div className="sticky top-0 bg-muted/30 px-6 py-3 flex items-center gap-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="flex-1 min-w-0">Bucket Name</div>
            <div className="w-32 flex-shrink-0">Type</div>
            <div className="w-32 flex-shrink-0">Actions</div>
          </div>

          {loading && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading buckets...</div>
          )}

          {isResolvingOrganization && !loading && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Resolving organization...</div>
          )}

          {!loading && !isResolvingOrganization && buckets.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              {effectiveOrganizationId ? 'No buckets yet. Create your first bucket.' : 'No organization is linked to this account.'}
            </div>
          )}

          {buckets.map((bucket) => (
            <div
              key={bucket.id}
              className="px-6 py-4 flex items-center gap-3 hover:bg-muted/20 transition-colors border-b border-border last:border-b-0 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{bucket.name}</p>
              </div>

              <div className="w-32 flex-shrink-0">
                <p className="text-sm text-muted-foreground">{bucket.type}</p>
              </div>

              <div className="w-32 flex-shrink-0 flex items-center gap-2">
                <button
                  onClick={() => setSelectedBucket(bucket.id)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded"
                  title="View details"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => setShowRulesEditor(bucket.id)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded"
                  title="Edit allocation rules"
                >
                  <Sliders size={16} />
                </button>
                <button
                  onClick={() => handleOpenEditModal(bucket)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded"
                  title="Edit bucket"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editingBucketId ? 'Edit Bucket' : 'Create Bucket'}</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Bucket Name</label>
                <input
                  type="text"
                  placeholder="e.g., Marketing Fund"
                  value={newBucketData.name}
                  onChange={(e) => setNewBucketData({ ...newBucketData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Type</label>
                <select
                  value={newBucketData.type}
                  onChange={(e) => setNewBucketData({ ...newBucketData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>Operating</option>
                  <option>Reserve</option>
                  <option>Liability</option>
                  <option>Owner</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Monthly Target (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 50000"
                  value={newBucketData.monthlyTarget}
                  onChange={(e) => setNewBucketData({ ...newBucketData, monthlyTarget: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCloseModal} variant="outline" className="flex-1" disabled={createLoading}>
                Cancel
              </Button>
              <Button
                onClick={editingBucketId ? handleUpdateBucket : handleCreateBucket}
                className="flex-1"
                disabled={createLoading || !newBucketData.name.trim() || !effectiveOrganizationId}
              >
                {createLoading ? (editingBucketId ? 'Saving...' : 'Creating...') : editingBucketId ? 'Save Changes' : 'Create Bucket'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
