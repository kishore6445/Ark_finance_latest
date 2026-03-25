'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { Mail, Plus, X, Clock, User, Bell } from 'lucide-react';

interface EmailNotificationRule {
  id: string;
  name: string;
  trigger: 'invoice_overdue' | 'compliance_alert' | 'approval_pending' | 'reconciliation_pending';
  recipients: string[];
  frequency: 'immediate' | 'daily' | 'weekly';
  enabled: boolean;
}

export function EmailNotificationSetup() {
  const { state, addNotification } = useAppState();
  const [rules, setRules] = useState<EmailNotificationRule[]>([
    {
      id: '1',
      name: 'Invoice Overdue Alert',
      trigger: 'invoice_overdue',
      recipients: ['finance@company.com'],
      frequency: 'daily',
      enabled: true,
    },
    {
      id: '2',
      name: 'Compliance Deadline Reminder',
      trigger: 'compliance_alert',
      recipients: ['owner@company.com', 'compliance@company.com'],
      frequency: 'weekly',
      enabled: true,
    },
  ]);

  const [showNewRule, setShowNewRule] = useState(false);
  const [newRule, setNewRule] = useState<Omit<EmailNotificationRule, 'id'>>({
    name: '',
    trigger: 'invoice_overdue',
    recipients: [],
    frequency: 'immediate',
    enabled: true,
  });
  const [newRecipient, setNewRecipient] = useState('');

  const handleAddRule = () => {
    if (!newRule.name || newRule.recipients.length === 0) return;

    const rule: EmailNotificationRule = {
      id: `rule-${Date.now()}`,
      ...newRule,
    };

    setRules([...rules, rule]);
    setNewRule({
      name: '',
      trigger: 'invoice_overdue',
      recipients: [],
      frequency: 'immediate',
      enabled: true,
    });
    setShowNewRule(false);

    addNotification({
      type: 'general',
      title: 'Email Rule Created',
      message: `Notification rule "${rule.name}" has been created`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  };

  const handleAddRecipient = () => {
    if (!newRecipient.includes('@')) return;
    setNewRule({
      ...newRule,
      recipients: [...newRule.recipients, newRecipient],
    });
    setNewRecipient('');
  };

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'invoice_overdue':
        return 'Invoice Overdue';
      case 'compliance_alert':
        return 'Compliance Alert';
      case 'approval_pending':
        return 'Approval Pending';
      case 'reconciliation_pending':
        return 'Reconciliation Pending';
      default:
        return trigger;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'immediate':
        return 'Immediately';
      case 'daily':
        return 'Daily Digest';
      case 'weekly':
        return 'Weekly Digest';
      default:
        return frequency;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail size={20} className="text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">Email Notifications</h2>
        </div>
        <button
          onClick={() => setShowNewRule(true)}
          className="px-4 py-2 bg-accent text-accent-foreground rounded font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Add Rule
        </button>
      </div>

      {/* New Rule Form */}
      {showNewRule && (
        <div className="p-6 bg-card border border-border rounded-lg space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Create New Email Rule</h3>
            <button
              onClick={() => setShowNewRule(false)}
              className="p-2 hover:bg-muted rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Rule Name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Rule Name
            </label>
            <input
              type="text"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              placeholder="e.g., Weekly AR Report"
              className="w-full px-3 py-2 border border-border rounded bg-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Trigger Type */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              When to Send
            </label>
            <select
              value={newRule.trigger}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  trigger: e.target.value as EmailNotificationRule['trigger'],
                })
              }
              className="w-full px-3 py-2 border border-border rounded bg-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="invoice_overdue">Invoice Overdue</option>
              <option value="compliance_alert">Compliance Alert</option>
              <option value="approval_pending">Approval Pending</option>
              <option value="reconciliation_pending">Reconciliation Pending</option>
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Frequency
            </label>
            <select
              value={newRule.frequency}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  frequency: e.target.value as EmailNotificationRule['frequency'],
                })
              }
              className="w-full px-3 py-2 border border-border rounded bg-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="immediate">Immediately</option>
              <option value="daily">Daily Digest (9 AM)</option>
              <option value="weekly">Weekly Digest (Monday 9 AM)</option>
            </select>
          </div>

          {/* Recipients */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Recipients
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-border rounded bg-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                onClick={handleAddRecipient}
                className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/70 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Recipient Tags */}
            <div className="flex flex-wrap gap-2">
              {newRule.recipients.map((recipient, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 bg-muted rounded-full text-sm flex items-center gap-2"
                >
                  <span>{recipient}</span>
                  <button
                    onClick={() =>
                      setNewRule({
                        ...newRule,
                        recipients: newRule.recipients.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddRule}
              className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded font-medium hover:bg-accent/90 transition-colors"
            >
              Create Rule
            </button>
            <button
              onClick={() => setShowNewRule(false)}
              className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded font-medium hover:bg-muted/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-lg">
            <Bell size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No email rules configured yet</p>
            <p className="text-xs text-muted-foreground mt-2">
              Add a rule to start receiving email notifications
            </p>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 bg-card border border-border rounded-lg flex items-start justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggleRule(rule.id)}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  <h3 className={`font-medium ${!rule.enabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {rule.name}
                  </h3>
                  {!rule.enabled && (
                    <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                      Disabled
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bell size={14} />
                    <span>{getTriggerLabel(rule.trigger)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={14} />
                    <span>{getFrequencyLabel(rule.frequency)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User size={14} />
                    <span>{rule.recipients.length} recipient(s)</span>
                  </div>
                </div>

                {/* Recipients List */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {rule.recipients.map((recipient, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded"
                    >
                      {recipient}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleDeleteRule(rule.id)}
                className="p-2 ml-4 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 bg-muted/30 border border-border rounded-lg">
        <p className="text-sm font-medium text-foreground mb-2">How it works</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Immediate rules send emails as soon as the trigger occurs</li>
          <li>• Daily digests send a summary email each morning at 9 AM</li>
          <li>• Weekly digests send a summary every Monday at 9 AM</li>
          <li>• Recipients must be valid email addresses</li>
        </ul>
      </div>
    </div>
  );
}
