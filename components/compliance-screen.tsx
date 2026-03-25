'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, CheckCircle2 } from 'lucide-react';

interface ComplianceItem {
  id: string;
  period: string; // "Mar 2026" or "Q1 FY26"
  name: string;
  type: 'Monthly' | 'Quarterly' | 'Statutory' | 'Audit';
  dueDate: string;
  status: 'Compliant' | 'Pending' | 'At Risk';
  evidence: 'Linked' | 'Missing' | 'Uploaded';
  lastActionDate: string;
  linkedObligation?: string; // ID of linked obligation
  resolutionSteps?: { label: string; completed: boolean }[];
}

type ViewMode = 'month' | 'quarter' | 'year';

interface ResolveStep {
  id: string;
  label: string;
  completed: boolean;
}

export function ComplianceScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [resolveSteps, setResolveSteps] = useState<Record<string, ResolveStep[]>>({});

  const [complianceData] = React.useState<ComplianceItem[]>([
    {
      id: 'gst-return-q4',
      period: 'Q4 FY25',
      name: 'GST Return Filing',
      type: 'Quarterly',
      dueDate: 'Mar 31, 2026',
      status: 'Compliant',
      evidence: 'Uploaded',
      lastActionDate: 'Feb 28, 2026',
    },
    {
      id: 'gst-return-q1',
      period: 'Q1 FY26',
      name: 'GST Return Filing',
      type: 'Quarterly',
      dueDate: 'Apr 30, 2026',
      status: 'Pending',
      evidence: 'Missing',
      lastActionDate: 'Feb 1, 2026',
    },
    {
      id: 'tds-deduction',
      period: 'Apr 2026',
      name: 'TDS Deduction & Payment',
      type: 'Monthly',
      dueDate: 'Apr 7, 2026',
      status: 'Compliant',
      evidence: 'Uploaded',
      lastActionDate: 'Mar 31, 2026',
    },
    {
      id: 'pf-deposit-mar',
      period: 'Mar 2026',
      name: 'PF Deposit',
      type: 'Monthly',
      dueDate: 'Mar 15, 2026',
      status: 'At Risk',
      evidence: 'Missing',
      lastActionDate: 'Mar 10, 2026',
      linkedObligation: '1', // Links to Priya Sharma salary obligation
      resolutionSteps: [
        { label: 'Calculate PF amount from payroll', completed: true },
        { label: 'Initiate NEFT transfer to EPFO', completed: false },
        { label: 'Upload payment proof', completed: false },
        { label: 'File e-return in NEFT portal', completed: false },
      ],
    },
    {
      id: 'pf-deposit-apr',
      period: 'Apr 2026',
      name: 'PF Deposit',
      type: 'Monthly',
      dueDate: 'Apr 15, 2026',
      status: 'Pending',
      evidence: 'Missing',
      lastActionDate: 'Mar 1, 2026',
    },
    {
      id: 'invoice-reconciliation',
      period: 'Feb 2026',
      name: 'Invoice Reconciliation',
      type: 'Monthly',
      dueDate: 'Feb 28, 2026',
      status: 'Pending',
      evidence: 'Linked',
      lastActionDate: 'Feb 5, 2026',
    },
    {
      id: 'bank-reconciliation',
      period: 'Feb 2026',
      name: 'Bank Reconciliation',
      type: 'Monthly',
      dueDate: 'Feb 28, 2026',
      status: 'Compliant',
      evidence: 'Uploaded',
      lastActionDate: 'Feb 28, 2026',
    },
    {
      id: 'audit-readiness',
      period: 'Annual',
      name: 'Audit Readiness',
      type: 'Audit',
      dueDate: 'Mar 31, 2027',
      status: 'Compliant',
      evidence: 'Uploaded',
      lastActionDate: 'Jan 31, 2026',
    },
  ]);

  // Calculate summary stats
  const stats = {
    compliant: complianceData.filter((i) => i.status === 'Compliant').length,
    pending: complianceData.filter((i) => i.status === 'Pending').length,
    atRisk: complianceData.filter((i) => i.status === 'At Risk').length,
  };

  const overallStatus = stats.atRisk > 0 ? 'At Risk' : stats.pending > 0 ? 'Pending' : 'Compliant';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'text-accent bg-accent/10';
      case 'At Risk':
        return 'text-destructive bg-destructive/10';
      case 'Pending':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  const getEvidenceColor = (evidence: string) => {
    switch (evidence) {
      case 'Uploaded':
        return 'text-accent bg-accent/10';
      case 'Linked':
        return 'text-blue-500 bg-blue-500/10';
      case 'Missing':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'text-accent';
      case 'At Risk':
        return 'text-destructive';
      case 'Pending':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const initializeResolveSteps = (itemId: string) => {
    if (!resolveSteps[itemId]) {
      setResolveSteps((prev) => ({
        ...prev,
        [itemId]: [
          { id: '1', label: 'Gather supporting documents', completed: false },
          { id: '2', label: 'Verify amounts and dates', completed: false },
          { id: '3', label: 'Upload to system', completed: false },
          { id: '4', label: 'Submit for approval', completed: false },
        ],
      }));
    }
  };

  const toggleStep = (itemId: string, stepId: string) => {
    setResolveSteps((prev) => ({
      ...prev,
      [itemId]: prev[itemId].map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      ),
    }));
  };

  const filteredData = complianceData;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <div className="bg-muted/20 border-b border-border px-8 py-4">
        <div className="flex items-center justify-between gap-6 mb-4">
          <h1 className="text-lg font-semibold">Compliance</h1>

          {/* Overall Status */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Overall Status</p>
              <p className={`text-lg font-semibold ${getOverallStatusColor(overallStatus)}`}>{overallStatus}</p>
            </div>

            {/* Status Counts */}
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="text-center">
                <p className="text-sm font-medium text-accent">{stats.compliant}</p>
                <p className="text-xs text-muted-foreground">Compliant</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-warning">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-destructive">{stats.atRisk}</p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2 bg-background rounded p-1 border border-border">
            {(['month', 'quarter', 'year'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  viewMode === mode
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="space-y-0 border border-border rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="flex h-10 items-center bg-muted/30 border-b border-border px-4 gap-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              <div className="w-24 flex-shrink-0">Period</div>
              <div className="flex-1 min-w-0">Obligation Name</div>
              <div className="w-20 flex-shrink-0">Type</div>
              <div className="w-28 flex-shrink-0">Due Date</div>
              <div className="w-24 flex-shrink-0">Status</div>
              <div className="w-20 flex-shrink-0">Evidence</div>
              <div className="w-28 flex-shrink-0">Last Action</div>
              <div className="w-16 flex-shrink-0 text-right">Actions</div>
            </div>

            {/* Data Rows */}
            {filteredData.map((item, idx) => (
              <React.Fragment key={item.id}>
                {/* Main Row */}
                <div
                  className="flex h-10 items-center hover:bg-muted/10 transition-colors border-b border-border px-4 gap-4 text-xs"
                  onClick={() => {
                    if (expandedRow === item.id) {
                      setExpandedRow(null);
                    } else {
                      setExpandedRow(item.id);
                      initializeResolveSteps(item.id);
                    }
                  }}
                >
                  <div className="w-24 flex-shrink-0 text-muted-foreground">{item.period}</div>
                  <div className="flex-1 min-w-0 text-foreground truncate font-medium">{item.name}</div>
                  <div className="w-20 flex-shrink-0 text-muted-foreground">{item.type}</div>
                  <div className="w-28 flex-shrink-0 text-muted-foreground">{item.dueDate}</div>
                  <div className="w-24 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded inline-block ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="w-20 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded inline-block ${getEvidenceColor(item.evidence)}`}>
                      {item.evidence}
                    </span>
                  </div>
                  <div className="w-28 flex-shrink-0 text-muted-foreground">{item.lastActionDate}</div>

                  {/* Actions */}
                  <div className="w-16 flex-shrink-0 flex items-center justify-end gap-1">
                    {item.status !== 'Compliant' && (
                      <button
                        className="p-1 text-warning hover:text-warning/70 transition-colors cursor-pointer"
                        title="Resolve"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (expandedRow === item.id) {
                            setExpandedRow(null);
                          } else {
                            setExpandedRow(item.id);
                            initializeResolveSteps(item.id);
                          }
                        }}
                      >
                        {expandedRow === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                    <button className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="View">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>

                {/* Expand Row - Resolve Steps */}
                {expandedRow === item.id && item.status !== 'Compliant' && resolveSteps[item.id] && (
                  <div className="bg-muted/10 border-b border-border px-4 py-4">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Resolve: {item.name}</p>

                      {/* Checklist Steps */}
                      <div className="space-y-2 mb-4">
                        {resolveSteps[item.id].map((step) => (
                          <label
                            key={step.id}
                            className="flex items-center gap-3 p-2 hover:bg-muted/20 rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={step.completed}
                              onChange={() => toggleStep(item.id, step.id)}
                              className="w-4 h-4 accent-accent"
                            />
                            <span className={`text-xs ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {step.label}
                            </span>
                          </label>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                        <button className="px-3 py-1.5 text-xs font-medium bg-accent text-background rounded hover:bg-accent/90 transition-colors">
                          <CheckCircle2 size={14} className="inline mr-1" />
                          Mark Complete
                        </button>
                        <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                          Add Note
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
