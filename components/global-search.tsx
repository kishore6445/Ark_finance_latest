'use client';

import React from "react"

import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, FileText, Users, AlertCircle, DollarSign, Zap } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'transaction' | 'invoice' | 'vendor' | 'obligation' | 'compliance';
  title: string;
  subtitle?: string;
  amount?: number;
  date?: string;
  icon: React.ReactNode;
}

interface GlobalSearchProps {
  onSelect?: (result: SearchResult) => void;
  onClose?: () => void;
}

export function GlobalSearch({ onSelect, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  const mockData = {
    transactions: [
      { id: 't1', description: 'Acme Studios - Project Delivery', amount: 45000, date: 'Feb 4' },
      { id: 't2', description: 'AWS Services', amount: 8500, date: 'Feb 3' },
      { id: 't3', description: 'Office Supplies', amount: 2500, date: 'Feb 2' },
      { id: 't4', description: 'Stripe Payment', amount: 12000, date: 'Feb 1' },
    ],
    invoices: [
      { id: 'inv1', number: 'INV-2401-001', party: 'Acme Studios', amount: 50000 },
      { id: 'inv2', number: 'INV-2401-002', party: 'Beta Corp', amount: 35000 },
      { id: 'inv3', number: 'BILL-2401-001', party: 'AWS Services', amount: 8500 },
    ],
    vendors: [
      { id: 'v1', name: 'AWS Services', type: 'SaaS' },
      { id: 'v2', name: 'Acme Studios', type: 'Client' },
      { id: 'v3', name: 'Office Supplies Co', type: 'Vendor' },
    ],
    obligations: [
      { id: 'o1', type: 'Salary', party: 'Priya Sharma', amount: 65000, dueDate: 'Feb 28' },
      { id: 'o2', type: 'Vendor Invoice', party: 'AWS Services', amount: 8500, dueDate: 'Feb 10' },
    ],
    compliance: [
      { id: 'c1', name: 'PF Deposit', dueDate: 'Feb 15' },
      { id: 'c2', name: 'GST Return', dueDate: 'Feb 28' },
    ],
  };

  // Search across all data
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const searchQuery = query.toLowerCase();
    const found: SearchResult[] = [];

    // Search transactions
    mockData.transactions.forEach((t) => {
      if (t.description.toLowerCase().includes(searchQuery)) {
        found.push({
          id: t.id,
          type: 'transaction',
          title: t.description,
          subtitle: t.date,
          amount: t.amount,
          icon: <DollarSign size={16} />,
        });
      }
    });

    // Search invoices
    mockData.invoices.forEach((inv) => {
      if (
        inv.number.toLowerCase().includes(searchQuery) ||
        inv.party.toLowerCase().includes(searchQuery)
      ) {
        found.push({
          id: inv.id,
          type: 'invoice',
          title: inv.number,
          subtitle: inv.party,
          amount: inv.amount,
          icon: <FileText size={16} />,
        });
      }
    });

    // Search vendors
    mockData.vendors.forEach((v) => {
      if (v.name.toLowerCase().includes(searchQuery)) {
        found.push({
          id: v.id,
          type: 'vendor',
          title: v.name,
          subtitle: v.type,
          icon: <Users size={16} />,
        });
      }
    });

    // Search obligations
    mockData.obligations.forEach((o) => {
      if (
        o.party.toLowerCase().includes(searchQuery) ||
        o.type.toLowerCase().includes(searchQuery)
      ) {
        found.push({
          id: o.id,
          type: 'obligation',
          title: `${o.type} - ${o.party}`,
          subtitle: o.dueDate,
          amount: o.amount,
          icon: <AlertCircle size={16} />,
        });
      }
    });

    // Search compliance
    mockData.compliance.forEach((c) => {
      if (c.name.toLowerCase().includes(searchQuery)) {
        found.push({
          id: c.id,
          type: 'compliance',
          title: c.name,
          subtitle: c.dueDate,
          icon: <Zap size={16} />,
        });
      }
    });

    setResults(found.slice(0, 10)); // Limit to 10 results
    setSelectedIndex(-1);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onClose]);

  const handleSelect = (result: SearchResult) => {
    const newRecentSearches = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    onSelect?.(result);
    onClose?.();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={20} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search transactions, invoices, vendors, obligations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm"
            autoFocus
          />
          {query && (
            <button
              onClick={handleClear}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results or Recent Searches */}
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors border-b border-border last:border-b-0 ${
                    index === selectedIndex ? 'bg-muted' : ''
                  }`}
                >
                  <div className="text-muted-foreground flex-shrink-0">{result.icon}</div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                    )}
                  </div>
                  {result.amount && (
                    <div className="text-sm font-semibold text-foreground flex-shrink-0">
                      ₹{result.amount.toLocaleString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim() === '' ? (
            <div className="px-4 py-6">
              <p className="text-xs text-muted-foreground font-semibold mb-3">Recent Searches</p>
              {recentSearches.length > 0 ? (
                <div className="space-y-2">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => setQuery(search)}
                      className="flex items-center gap-2 w-full p-2 text-sm text-foreground hover:bg-muted rounded transition-colors"
                    >
                      <Clock size={14} className="text-muted-foreground" />
                      {search}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No recent searches</p>
              )}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex justify-between">
          <span>Use arrow keys to navigate, Enter to select</span>
          <button
            onClick={onClose}
            className="hover:text-foreground transition-colors"
          >
            Press Esc to close
          </button>
        </div>
      </div>
    </div>
  );
}
