'use client';

import { useState } from 'react';
import { Check, X, CheckCircle, AlertCircle, Trash2, Download, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BulkActionItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'transaction' | 'invoice';
  selected: boolean;
}

export function BulkActionsPanel() {
  const [items, setItems] = useState<BulkActionItem[]>([
    { id: '1', description: 'Acme Studios - Project Delivery', amount: 45000, date: 'Feb 4', type: 'transaction', selected: false },
    { id: '2', description: 'AWS Services', amount: 8500, date: 'Feb 2', type: 'transaction', selected: false },
    { id: '3', description: 'Office Supplies', amount: 3200, date: 'Feb 1', type: 'transaction', selected: false },
    { id: '4', description: 'INV-2401-001', amount: 50000, date: 'Jan 20', type: 'invoice', selected: false },
    { id: '5', description: 'INV-2401-002', amount: 35000, date: 'Feb 15', type: 'invoice', selected: false },
    { id: '6', description: 'BILL-2401-001', amount: 8500, date: 'Jan 25', type: 'invoice', selected: false },
  ]);

  const [bulkAction, setBulkAction] = useState<string | null>(null);

  const selectedItems = items.filter((item) => item.selected);
  const totalSelected = selectedItems.length;
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.amount, 0);

  const toggleSelection = (id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)));
  };

  const toggleAllSelection = () => {
    const allSelected = items.every((item) => item.selected);
    setItems(items.map((item) => ({ ...item, selected: !allSelected })));
  };

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) return;

    switch (action) {
      case 'mark-matched':
        console.log('[v0] Marking items as matched:', selectedItems.map((i) => i.id));
        setItems(items.filter((item) => !item.selected));
        setBulkAction(null);
        break;
      case 'mark-approved':
        console.log('[v0] Approving items:', selectedItems.map((i) => i.id));
        setItems(items.filter((item) => !item.selected));
        setBulkAction(null);
        break;
      case 'delete':
        console.log('[v0] Deleting items:', selectedItems.map((i) => i.id));
        setItems(items.filter((item) => !item.selected));
        setBulkAction(null);
        break;
      case 'export':
        console.log('[v0] Exporting items:', selectedItems);
        alert(`Exporting ${selectedItems.length} items to CSV`);
        break;
      case 'send-reminder':
        console.log('[v0] Sending reminders for:', selectedItems.map((i) => i.id));
        alert(`Sending payment reminders for ${selectedItems.length} items`);
        break;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'transaction' ? 'Transaction' : 'Invoice';
  };

  const getTypeBgColor = (type: string) => {
    return type === 'transaction' ? 'bg-blue-50' : 'bg-purple-50';
  };

  return (
    <div className="space-y-6">
      {/* Selection Bar */}
      {totalSelected > 0 && (
        <Card className="p-4 border border-accent bg-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-lg font-semibold text-foreground">{totalSelected} selected</div>
                <div className="text-sm text-muted-foreground">₹{totalAmount.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setBulkAction('mark-matched')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Mark Matched
              </Button>
              <Button
                onClick={() => setBulkAction('mark-approved')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Check size={16} />
                Approve
              </Button>
              <Button
                onClick={() => setBulkAction('export')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Export
              </Button>
              <Button
                onClick={() => setBulkAction('send-reminder')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Send size={16} />
                Remind
              </Button>
              <Button
                onClick={() => setBulkAction('delete')}
                size="sm"
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Items Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={items.every((item) => item.selected) && items.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b border-border ${item.selected ? 'bg-accent/10' : index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelection(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{item.description}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeBgColor(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="px-8 py-12 text-center">
            <AlertCircle size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No items available</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {bulkAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {bulkAction === 'mark-matched' && 'Mark as Matched?'}
              {bulkAction === 'mark-approved' && 'Approve Selected Items?'}
              {bulkAction === 'delete' && 'Delete Selected Items?'}
              {bulkAction === 'export' && 'Export to CSV?'}
              {bulkAction === 'send-reminder' && 'Send Payment Reminders?'}
            </h2>

            <p className="text-sm text-muted-foreground mb-6">
              {bulkAction === 'mark-matched' && `Mark ${totalSelected} items as matched?`}
              {bulkAction === 'mark-approved' && `Approve ${totalSelected} items for ₹${totalAmount.toLocaleString('en-IN')}?`}
              {bulkAction === 'delete' && `Delete ${totalSelected} items? This cannot be undone.`}
              {bulkAction === 'export' && `Export ${totalSelected} items to CSV file?`}
              {bulkAction === 'send-reminder' && `Send payment reminders for ${totalSelected} items?`}
            </p>

            <div className="flex gap-3 justify-end">
              <Button onClick={() => setBulkAction(null)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => handleBulkAction(bulkAction)}
                variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              >
                {bulkAction === 'mark-matched' && 'Mark Matched'}
                {bulkAction === 'mark-approved' && 'Approve'}
                {bulkAction === 'delete' && 'Delete'}
                {bulkAction === 'export' && 'Export'}
                {bulkAction === 'send-reminder' && 'Send'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
