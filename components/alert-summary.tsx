'use client';

import { useState } from 'react';
import { ChevronDown, AlertTriangle, Clock, FileText, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Alert {
  id: string;
  type: 'overdue' | 'approval' | 'compliance' | 'budget';
  message: string;
  count: number;
  details?: string[];
}

interface AlertSummaryProps {
  alerts: Alert[];
}

export function AlertSummary({ alerts }: AlertSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalAlerts = alerts.reduce((sum, alert) => sum + alert.count, 0);

  const alertConfig = {
    overdue: { 
      icon: AlertTriangle, 
      color: 'text-error', 
      borderColor: 'rgb(239, 68, 68)',
      label: 'Overdue' 
    },
    approval: { 
      icon: Clock, 
      color: 'text-warning', 
      borderColor: 'rgb(217, 119, 6)',
      label: 'Pending' 
    },
    compliance: { 
      icon: FileText, 
      color: 'text-warning', 
      borderColor: 'rgb(217, 119, 6)',
      label: 'Compliance' 
    },
    budget: { 
      icon: AlertCircle, 
      color: 'text-info', 
      borderColor: 'rgb(37, 99, 235)',
      label: 'Budget' 
    },
  };

  const activeAlerts = alerts.filter(alert => alert.count > 0);

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-error overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full"
      >
        <div className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
                <AlertTriangle size={20} className="text-error" />
              </div>
              <div className="text-left">
                <p className="text-base font-bold text-foreground">{totalAlerts} Items Need Attention</p>
                <p className="text-xs text-muted-foreground mt-0.5">Critical issues requiring immediate action</p>
              </div>
            </div>
            <ChevronDown
              size={20}
              className={`text-error transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 py-3 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeAlerts.map((alert) => {
              const config = alertConfig[alert.type];
              const Icon = config.icon;
              return (
                <div
                  key={alert.id}
                  style={{ borderLeft: `4px solid ${config.borderColor}` }}
                  className="p-3 rounded-lg bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-2">
                    <Icon size={16} className={`flex-shrink-0 mt-0.5 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${config.color}`}>{alert.count}</p>
                      <p className="text-xs text-foreground/70 capitalize">{alert.message}</p>
                      {alert.details && alert.details.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {alert.details.slice(0, 1).map((detail, idx) => (
                            <p key={idx} className="text-xs text-foreground/60">• {detail}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2">
            <button className="flex-1 px-3 py-1.5 bg-error text-error-foreground rounded-lg font-medium text-xs hover:opacity-90 transition-opacity">
              Review All
            </button>
            <button className="flex-1 px-3 py-1.5 bg-transparent border border-error text-error rounded-lg font-medium text-xs hover:bg-error/10 transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
