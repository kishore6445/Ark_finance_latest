'use client';

import { useAppState } from '@/context/app-state';
import { X, Bell, AlertTriangle, Clock, CheckCircle, FileText } from 'lucide-react';

export function NotificationCenter() {
  const { state, markNotificationAsRead, clearNotification } = useAppState();

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice_overdue':
        return <AlertTriangle size={16} />;
      case 'compliance_alert':
        return <Clock size={16} />;
      case 'approval_needed':
        return <CheckCircle size={16} />;
      case 'reconciliation_pending':
        return <FileText size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'invoice_overdue':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'compliance_alert':
        return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'approval_needed':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'reconciliation_pending':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-destructive text-destructive-foreground rounded-full text-xs font-medium">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {state.notifications.length === 0 ? (
        <div className="p-8 text-center bg-card border border-border rounded-lg">
          <Bell size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markNotificationAsRead(notification.id)}
              className={`p-4 border rounded-lg flex gap-4 items-start cursor-pointer transition-all ${
                notification.read
                  ? 'bg-card border-border'
                  : `${getNotificationColor(notification.type)} border`
              }`}
            >
              <div className="p-2 rounded-lg bg-background/50">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotification(notification.id);
                }}
                className="p-2 hover:bg-muted rounded transition-colors flex-shrink-0"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
