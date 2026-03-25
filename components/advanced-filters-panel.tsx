'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FilterOption {
  label: string;
  value: string;
}

interface AdvancedFiltersProps {
  onFiltersChange?: (filters: any) => void;
  type?: 'inbox' | 'invoices';
}

export function AdvancedFiltersPanel({ onFiltersChange, type = 'inbox' }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    dateRange: 'all',
    amount: { min: '', max: '' },
    category: [] as string[],
    vendor: [] as string[],
    paymentStatus: [] as string[],
    priority: [] as string[],
  });

  const statusOptions: FilterOption[] = type === 'inbox'
    ? [
        { label: 'Needs Info', value: 'needs-info' },
        { label: 'Categorized', value: 'categorized' },
        { label: 'Ready to Post', value: 'ready-to-post' },
        { label: 'Posted', value: 'posted' },
      ]
    : [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Partial', value: 'partial' },
      ];

  const dateRangeOptions: FilterOption[] = [
    { label: 'All Time', value: 'all' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last Quarter', value: '90d' },
    { label: 'Last Year', value: '365d' },
    { label: 'Custom', value: 'custom' },
  ];

  const categoryOptions: FilterOption[] = [
    { label: 'Salaries', value: 'salaries' },
    { label: 'Utilities', value: 'utilities' },
    { label: 'Office', value: 'office' },
    { label: 'Technology', value: 'technology' },
    { label: 'Travel', value: 'travel' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Other', value: 'other' },
  ];

  const vendorOptions: FilterOption[] = [
    { label: 'AWS Services', value: 'aws' },
    { label: 'Office Supplies Co', value: 'office-supplies' },
    { label: 'Acme Studios', value: 'acme' },
    { label: 'Tech Consultants Ltd', value: 'tech-consultants' },
  ];

  const paymentStatusOptions: FilterOption[] = [
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Pending', value: 'pending' },
  ];

  const priorityOptions: FilterOption[] = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  const toggleFilter = (category: string, value: string) => {
    setFilters((prev) => {
      const array = prev[category as keyof typeof prev] as string[];
      const updated = array.includes(value)
        ? array.filter((v) => v !== value)
        : [...array, value];
      return { ...prev, [category]: updated };
    });
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.dateRange !== 'all' ||
    filters.amount.min ||
    filters.amount.max ||
    filters.category.length > 0 ||
    filters.vendor.length > 0 ||
    filters.paymentStatus.length > 0 ||
    filters.priority.length > 0;

  const clearFilters = () => {
    setFilters({
      status: [],
      dateRange: 'all',
      amount: { min: '', max: '' },
      category: [],
      vendor: [],
      paymentStatus: [],
      priority: [],
    });
  };

  const renderCheckboxGroup = (
    label: string,
    options: FilterOption[],
    category: string,
    selected: string[]
  ) => (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase">{label}</label>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => toggleFilter(category, option.value)}
              className="rounded"
            />
            <span className="text-sm text-foreground">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          hasActiveFilters
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-border bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        <Filter size={18} />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-accent text-accent-foreground">
            {filters.status.length +
              (filters.dateRange !== 'all' ? 1 : 0) +
              (filters.amount.min || filters.amount.max ? 1 : 0) +
              filters.category.length +
              filters.vendor.length +
              filters.paymentStatus.length +
              filters.priority.length}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 w-80 bg-card border border-border rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Advanced Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Status */}
            {renderCheckboxGroup('Status', statusOptions, 'status', filters.status)}

            {/* Date Range */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {dateRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Range */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase">Amount Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.amount.min}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      amount: { ...filters.amount, min: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.amount.max}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      amount: { ...filters.amount, max: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Category */}
            {renderCheckboxGroup('Category', categoryOptions, 'category', filters.category)}

            {/* Vendor */}
            {renderCheckboxGroup('Vendor', vendorOptions, 'vendor', filters.vendor)}

            {/* Payment Status (for invoices) */}
            {type === 'invoices' && renderCheckboxGroup('Payment Status', paymentStatusOptions, 'paymentStatus', filters.paymentStatus)}

            {/* Priority */}
            {renderCheckboxGroup('Priority', priorityOptions, 'priority', filters.priority)}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-6 border-t border-border flex gap-2">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={!hasActiveFilters}
            >
              Clear All
            </Button>
            <Button
              onClick={() => {
                onFiltersChange?.(filters);
                setIsOpen(false);
              }}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
