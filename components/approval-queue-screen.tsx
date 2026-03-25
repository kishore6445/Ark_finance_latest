'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { ChevronDown, CheckCircle, XCircle, Clock, UserPlus, ArrowRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ApprovalQueueScreen() {
  const { state, approveRequest, rejectRequest, assignApprovalRequest, reassignApprovalRequest, addApprovalRequest } = useAppState();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [approvalNote, setApprovalNote] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<Record<string, string>>({});
  const [showAddTask, setShowAddTask] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'expense' | 'invoice' | 'budget_variance',
    limit: 50000,
  });

  // Mock users list - would come from database in production
  const users = [
    { id: 'finance-manager', name: 'Finance Manager' },
    { id: 'controller', name: 'Controller' },
    { id: 'cfo', name: 'CFO' },
    { id: 'manager', name: 'Manager' },
  ];

  const filteredApprovals = state.pendingApprovals.filter((approval) => {
    if (filterStatus === 'all') return true;
    return approval.status === filterStatus;
  });

  const handleApprove = (id: string) => {
    approveRequest(id, 'Finance Manager', approvalNote[id]);
    setApprovalNote((prev) => ({ ...prev, [id]: '' }));
  };

  const handleReject = (id: string) => {
    rejectRequest(id, 'Finance Manager', approvalNote[id]);
    setApprovalNote((prev) => ({ ...prev, [id]: '' }));
  };

  const handleAssign = (id: string) => {
    const assignee = selectedAssignee[id];
    if (assignee) {
      const approval = state.pendingApprovals.find((a) => a.id === id);
      if (approval?.assignedTo) {
        reassignApprovalRequest(id, 'Admin', assignee);
      } else {
        assignApprovalRequest(id, 'Admin', assignee);
      }
      setSelectedAssignee((prev) => ({ ...prev, [id]: '' }));
      setAssigningId(null);
    }
  };

  const handleAddTask = () => {
    if (formData.description && formData.amount) {
      addApprovalRequest({
        type: formData.type,
        description: formData.description,
        amount: parseInt(formData.amount),
        requester: 'Current User',
        requestedAt: new Date().toISOString(),
        status: 'pending',
        requiresApproval: true,
        limit: formData.limit,
      });
      setFormData({ description: '', amount: '', type: 'expense', limit: 50000 });
      setShowAddTask(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'rejected':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Pending Approvals</p>
          <p className="text-2xl font-bold text-yellow-600">
            {state.pendingApprovals.filter((a) => a.status === 'pending').length}
          </p>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Pending Amount</p>
          <p className="text-2xl font-bold text-yellow-600">
            ₹
            {state.pendingApprovals
              .filter((a) => a.status === 'pending')
              .reduce((sum, a) => sum + a.amount, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Approved</p>
          <p className="text-2xl font-bold text-accent">
            {state.pendingApprovals.filter((a) => a.status === 'approved').length}
          </p>
        </div>
        <div className="p-4 bg-card border border-border rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Rejected</p>
          <p className="text-2xl font-bold text-destructive">
            {state.pendingApprovals.filter((a) => a.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Filter and Add Task */}
      <div className="flex gap-3 justify-between items-center">
        <div className="flex gap-3">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setShowAddTask(true)}
          className="gap-2"
        >
          <Plus size={16} />
          Add Task
        </Button>
      </div>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <div className="p-12 bg-card border border-border rounded-lg text-center">
          <p className="text-muted-foreground">No approvals to display</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApprovals.map((approval) => (
            <div
              key={approval.id}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === approval.id ? null : approval.id)
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className={`p-2 rounded-lg border ${getStatusColor(approval.status)}`}>
                    {getStatusIcon(approval.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {approval.type === 'expense' ? 'Expense' : 'Invoice'} Approval
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {approval.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">₹{approval.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(approval.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-muted-foreground transition-transform ${
                    expandedId === approval.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Details */}
              {expandedId === approval.id && (
                <div className="px-6 py-4 border-t border-border bg-muted/30 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <p className="font-medium capitalize">{approval.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Amount</p>
                      <p className="font-medium">₹{approval.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Requester</p>
                      <p className="font-medium">{approval.requester}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Requested</p>
                      <p className="font-medium">
                        {new Date(approval.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    {approval.assignedTo && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                        <p className="font-medium">{approval.assignedTo}</p>
                      </div>
                    )}
                  </div>

                  {/* Assignment Section */}
                  {approval.status === 'pending' && (
                    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <UserPlus size={16} className="text-muted-foreground" />
                        <p className="text-sm font-medium">Assign Task</p>
                      </div>
                      {assigningId === approval.id ? (
                        <div className="flex gap-2">
                          <select
                            value={selectedAssignee[approval.id] || ''}
                            onChange={(e) =>
                              setSelectedAssignee((prev) => ({
                                ...prev,
                                [approval.id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                          >
                            <option value="">Select assignee...</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.name}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssign(approval.id)}
                            disabled={!selectedAssignee[approval.id]}
                            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => setAssigningId(null)}
                            className="px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssigningId(approval.id)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
                        >
                          {approval.assignedTo ? `Reassign (Currently: ${approval.assignedTo})` : 'Assign to Someone'}
                        </button>
                      )}
                    </div>
                  )}

                  {approval.status === 'pending' && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">
                        Approval Note (Optional)
                      </label>
                      <textarea
                        value={approvalNote[approval.id] || ''}
                        onChange={(e) =>
                          setApprovalNote((prev) => ({
                            ...prev,
                            [approval.id]: e.target.value,
                          }))
                        }
                        placeholder="Add a note for the requester..."
                        className="w-full px-3 py-2 text-sm border border-border rounded bg-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        rows={3}
                      />
                    </div>
                  )}

                  {approval.approvalNote && (
                    <div className="p-3 bg-card border border-border rounded">
                      <p className="text-xs text-muted-foreground mb-1">Approval Note</p>
                      <p className="text-sm text-foreground">{approval.approvalNote}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        By {approval.approver} on{' '}
                        {new Date(approval.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {approval.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(approval.id)}
                        className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(approval.id)}
                        className="flex-1 px-4 py-2 bg-destructive/20 text-destructive rounded font-medium hover:bg-destructive/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Approval Request</h2>
              <button
                onClick={() => setShowAddTask(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as 'expense' | 'invoice' | 'budget_variance' })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="expense">Expense</option>
                  <option value="invoice">Invoice</option>
                  <option value="budget_variance">Budget Variance</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter description"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Approval Limit</label>
                <input
                  type="number"
                  value={formData.limit}
                  onChange={(e) =>
                    setFormData({ ...formData, limit: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleAddTask}
                disabled={!formData.description || !formData.amount}
                className="flex-1"
              >
                Create Request
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
