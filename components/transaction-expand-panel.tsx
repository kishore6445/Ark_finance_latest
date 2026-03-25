'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  partyName: string;
  pendingAmount: number;
}

interface TransactionExpandPanelProps {
  transactionId: string;
  bankAmount: number;
  accountingType: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  subtype: string;
  gstSplit: {
    taxable: number;
    gst: number;
  };
  notes?: string;
  attachmentPreview?: string;
  status: 'recorded' | 'needs-info' | 'action-required';
  onStatusChange: (status: 'recorded' | 'needs-info' | 'action-required') => void;
  onAccountingTypeChange?: (type: 'Revenue' | 'Expense' | 'Asset' | 'Liability') => void;
}

const sampleInvoices: Record<string, Invoice[]> = {
  Revenue: [
    { id: 'inv-1', number: 'INV-001', partyName: 'Acme Studios', pendingAmount: 45000 },
    { id: 'inv-2', number: 'INV-002', partyName: 'Beta Corp', pendingAmount: 28000 },
    { id: 'inv-3', number: 'INV-003', partyName: 'Gamma Ltd', pendingAmount: 12500 },
  ],
  Expense: [
    { id: 'bill-1', number: 'BILL-001', partyName: 'AWS', pendingAmount: 8500 },
    { id: 'bill-2', number: 'BILL-002', partyName: 'Office Supplies Co', pendingAmount: 3200 },
    { id: 'bill-3', number: 'BILL-003', partyName: 'Vendor XYZ', pendingAmount: 15000 },
  ],
};

const subtypeOptions: Record<string, string[]> = {
  Revenue: ['Sales', 'Service Income', 'Investment Returns', 'Other Income'],
  Expense: ['Operating', 'COGS', 'Travel', 'Utilities', 'Salaries', 'Other'],
  Asset: ['Cash', 'Inventory', 'Equipment', 'Other'],
  Liability: ['Accounts Payable', 'Loans', 'GST Payable', 'Other'],
};

export function TransactionExpandPanel({
  transactionId,
  bankAmount,
  accountingType,
  subtype,
  gstSplit,
  notes,
  attachmentPreview,
  status,
  onStatusChange,
  onAccountingTypeChange,
}: TransactionExpandPanelProps) {
  const [localAccountingType, setLocalAccountingType] = useState(accountingType);
  const [localSubtype, setLocalSubtype] = useState(subtype);
  const [localGstTaxable, setLocalGstTaxable] = useState(gstSplit.taxable);
  const [localGstAmount, setLocalGstAmount] = useState(gstSplit.gst);
  const [localNotes, setLocalNotes] = useState(notes || '');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showSubtypeMenu, setShowSubtypeMenu] = useState(false);
  const [showInvoiceMenu, setShowInvoiceMenu] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [adjustmentMode, setAdjustmentMode] = useState<'full' | 'partial'>('full');
  const [adjustedAmount, setAdjustedAmount] = useState(bankAmount);

  const handleAccountingTypeChange = (newType: 'Revenue' | 'Expense' | 'Asset' | 'Liability') => {
    setLocalAccountingType(newType);
    setSelectedInvoice(null);
    setAdjustmentMode('full');
    setAdjustedAmount(bankAmount);
    onAccountingTypeChange?.(newType);
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceMenu(false);
  };

  const handleAdjustmentChange = (mode: 'full' | 'partial') => {
    setAdjustmentMode(mode);
    if (mode === 'full' && selectedInvoice) {
      setAdjustedAmount(Math.min(bankAmount, selectedInvoice.pendingAmount));
    }
  };

  const showInvoiceMatching = ['Revenue', 'Expense'].includes(localAccountingType);
  const invoiceTypeLabel = localAccountingType === 'Revenue' ? 'Invoice' : 'Bill';
  const invoiceList = sampleInvoices[localAccountingType] || [];

  return (
    <div className="border-t border-border bg-background px-6 py-2 overflow-x-auto">
      {/* Single Horizontal Line - All Fields in One Row */}
      <div className="flex items-start gap-2 min-w-max">
        {/* Type: [Dropdown] */}
        <div className="flex-shrink-0 flex items-end gap-1">
          <span className="text-xs text-muted-foreground font-semibold">Type:</span>
          <div className="relative">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex items-center justify-between px-1.5 py-0.5 bg-input border border-border rounded text-xs font-medium text-foreground hover:border-primary transition-colors w-24"
            >
              <span className="truncate text-xs">{localAccountingType}</span>
              <ChevronDown size={12} className="text-muted-foreground flex-shrink-0 ml-0.5" />
            </button>
            {showTypeMenu && (
              <div className="absolute top-full left-0 mt-0.5 bg-card border border-border rounded shadow-md z-10 w-28">
                {['Revenue', 'Expense', 'Asset', 'Liability'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      handleAccountingTypeChange(type as any);
                      setShowTypeMenu(false);
                    }}
                    className={`w-full text-left px-2 py-0.5 text-xs hover:bg-muted transition-colors ${
                      localAccountingType === type ? 'bg-muted text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subtype: [Dropdown] */}
        <div className="flex-shrink-0 flex items-end gap-1">
          <span className="text-xs text-muted-foreground font-semibold">Subtype:</span>
          <div className="relative">
            <button
              onClick={() => setShowSubtypeMenu(!showSubtypeMenu)}
              className="flex items-center justify-between px-1.5 py-0.5 bg-input border border-border rounded text-xs font-medium text-foreground hover:border-primary transition-colors w-24"
            >
              <span className="truncate text-xs text-xs">{localSubtype}</span>
              <ChevronDown size={12} className="text-muted-foreground flex-shrink-0 ml-0.5" />
            </button>
            {showSubtypeMenu && (
              <div className="absolute top-full left-0 mt-0.5 bg-card border border-border rounded shadow-md z-10 w-40 max-h-40 overflow-y-auto">
                {subtypeOptions[localAccountingType]?.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setLocalSubtype(option);
                      setShowSubtypeMenu(false);
                    }}
                    className={`w-full text-left px-2 py-0.5 text-xs hover:bg-muted transition-colors ${
                      localSubtype === option ? 'bg-muted text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Invoice: [Dropdown + Full/Partial] (Conditional) */}
        {showInvoiceMatching && (
          <>
            <div className="flex-shrink-0 flex items-end gap-1">
              <span className="text-xs text-muted-foreground font-semibold">{invoiceTypeLabel}:</span>
              <div className="relative">
                <button
                  onClick={() => setShowInvoiceMenu(!showInvoiceMenu)}
                  className="flex items-center justify-between px-1.5 py-0.5 bg-input border border-border rounded text-xs font-medium text-foreground hover:border-primary transition-colors w-32"
                >
                  <span className="truncate text-xs">
                    {selectedInvoice ? selectedInvoice.number : 'Select'}
                  </span>
                  <ChevronDown size={12} className="text-muted-foreground flex-shrink-0 ml-0.5" />
                </button>
                {showInvoiceMenu && (
                  <div className="absolute top-full left-0 mt-0.5 bg-card border border-border rounded shadow-md z-10 w-44 max-h-36 overflow-y-auto">
                    {invoiceList.map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => handleInvoiceSelect(invoice)}
                        className={`w-full text-left px-2 py-0.5 text-xs hover:bg-muted transition-colors border-b border-border/50 last:border-b-0 ${
                          selectedInvoice?.id === invoice.id ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        <span className="font-mono">{invoice.number}</span> {invoice.partyName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Adjustment Mode (Full/Partial) */}
            {selectedInvoice && (
              <div className="flex-shrink-0 flex items-end gap-1">
                <span className="text-xs text-muted-foreground font-semibold">Adj:</span>
                <button
                  onClick={() => handleAdjustmentChange('full')}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium transition-all ${
                    adjustmentMode === 'full'
                      ? 'bg-primary text-primary-foreground border border-primary'
                      : 'bg-background border border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Full
                </button>
                <button
                  onClick={() => handleAdjustmentChange('partial')}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium transition-all ${
                    adjustmentMode === 'partial'
                      ? 'bg-primary text-primary-foreground border border-primary'
                      : 'bg-background border border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Partial
                </button>
              </div>
            )}
          </>
        )}

        {/* GST (Read-only, Inline) */}
        {gstSplit.taxable > 0 && (
          <div className="flex-shrink-0 flex items-end gap-1">
            <span className="text-xs text-muted-foreground font-semibold">GST:</span>
            <div className="px-1.5 py-0.5 bg-muted/40 border border-border rounded text-xs font-mono text-muted-foreground">
              ₹{localGstAmount.toLocaleString()}
            </div>
          </div>
        )}

        {/* Notes (Inline Input) */}
        <div className="flex-shrink-0 flex items-end gap-1">
          <span className="text-xs text-muted-foreground font-semibold">Notes:</span>
          <input
            type="text"
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="..."
            className="px-1.5 py-0.5 bg-input border border-border rounded text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none w-28"
          />
        </div>

        {/* Status (Read-only Badge) */}
        <div className="flex-shrink-0 flex items-end gap-1">
          <span className="text-xs text-muted-foreground font-semibold">Status:</span>
          <div className="px-1.5 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20">
            Recorded
          </div>
        </div>

        {/* ID (Far Right, Anchor) */}
        <div className="flex-shrink-0 flex items-end gap-1 ml-4">
          <span className="text-xs text-muted-foreground font-semibold">ID:</span>
          <span className="text-xs font-mono text-muted-foreground">{transactionId}</span>
        </div>
      </div>
    </div>
  );
}
