'use client';

import React from "react"
import { useState, useRef } from 'react';
import { Upload, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ColumnMapping {
  originalName: string;
  mappedTo: 'date' | 'description' | 'amount' | 'credit' | 'debit' | 'reference' | 'ignore';
  sampleData: (string | number)[];
}

export function ImportScreen() {
  const [bankAccount, setBankAccount] = useState('');
  const [bank, setBank] = useState('auto');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsed, setIsParsed] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionCount, setTransactionCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankAccountOptions = [
    { id: 'hdfc-current', label: 'HDFC Current ••••1234' },
    { id: 'icici-savings', label: 'ICICI Savings ••••7788' },
    { id: 'cash', label: 'Cash' },
  ];

  const bankOptions = [
    { id: 'auto', label: 'Auto-detect' },
    { id: 'hdfc', label: 'HDFC' },
    { id: 'icici', label: 'ICICI' },
    { id: 'axis', label: 'Axis' },
    { id: 'sbi', label: 'SBI' },
    { id: 'other', label: 'Other' },
  ];

  const mappingOptions = [
    { id: 'date', label: 'Date' },
    { id: 'description', label: 'Description' },
    { id: 'amount', label: 'Amount' },
    { id: 'credit', label: 'Credit' },
    { id: 'debit', label: 'Debit' },
    { id: 'reference', label: 'Reference ID' },
    { id: 'ignore', label: 'Ignore' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      setUploadedFile(file);
    }
  };

  const handleParsePreview = () => {
    if (!uploadedFile || !bankAccount) return;

    // Mock CSV parsing
    const mockMappings: ColumnMapping[] = [
      { originalName: 'Transaction Date', mappedTo: 'date', sampleData: ['02-Feb-2025', '01-Feb-2025'] },
      { originalName: 'Description', mappedTo: 'description', sampleData: ['Acme Studios - Invoice', 'AWS Services'] },
      { originalName: 'Credit', mappedTo: 'credit', sampleData: [45000, ''] },
      { originalName: 'Debit', mappedTo: 'debit', sampleData: ['', 8500] },
      { originalName: 'Balance', mappedTo: 'ignore', sampleData: [245000, 200000] },
      { originalName: 'Ref', mappedTo: 'reference', sampleData: ['INV001', 'AWS-Feb'] },
    ];

    setColumnMappings(mockMappings);
    setIsParsed(true);
  };

  const handleMappingChange = (index: number, newMapping: string) => {
    const updated = [...columnMappings];
    updated[index].mappedTo = newMapping as any;
    setColumnMappings(updated);
  };

  const handleSendToInbox = () => {
    // Mock sending to inbox
    setTransactionCount(124);
    setShowSuccess(true);
  };

  const handleCancel = () => {
    setUploadedFile(null);
    setIsParsed(false);
    setColumnMappings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Success Screen
  if (showSuccess) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{transactionCount} transactions sent to Inbox</h2>
            <p className="text-sm text-muted-foreground">Your bank statement has been processed and is ready for review.</p>
          </div>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Go to Inbox
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Upload Bar */}
      <div className="border-b border-border px-6 py-4 space-y-4">
        <div className="flex items-end gap-4">
          {/* Bank Account Dropdown */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Bank Account
            </label>
            <select
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-medium text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">Select account...</option>
              {bankAccountOptions.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.label}</option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              File (CSV / Excel)
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-colors flex items-center justify-between"
              >
                <span className="truncate">{uploadedFile?.name || 'Choose file...'}</span>
                <Upload size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
              </button>
            </div>
          </div>

          {/* Bank Dropdown */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Bank
            </label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-medium text-foreground focus:border-primary focus:outline-none"
            >
              {bankOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Parse Button */}
          <Button
            onClick={handleParsePreview}
            disabled={!uploadedFile || !bankAccount}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Parse & Preview
          </Button>
        </div>
      </div>

      {/* Mapping Table - Shows after Parse */}
      {isParsed && (
        <div className="flex-1 overflow-auto border-b border-border">
          <div className="inline-block min-w-full">
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-48">
                    Original Column
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">
                    Mapped To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
                    Sample Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {columnMappings.map((mapping, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{mapping.originalName}</td>
                    <td className="px-6 py-4">
                      <select
                        value={mapping.mappedTo}
                        onChange={(e) => handleMappingChange(idx, e.target.value)}
                        className="px-2 py-1 bg-input border border-border rounded text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                      >
                        {mappingOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="space-y-1">
                        {mapping.sampleData.map((sample, i) => (
                          <div key={i} className="text-xs font-mono">{sample || '(empty)'}</div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Bar */}
      {isParsed && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-border">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="border-border text-foreground hover:bg-muted bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendToInbox}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Send to Inbox
          </Button>
        </div>
      )}
    </main>
  );
}
