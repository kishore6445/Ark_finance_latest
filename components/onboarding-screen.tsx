'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Plus, X } from 'lucide-react';

interface ConnectedAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountType: 'current' | 'savings' | 'credit-card';
}

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'connect-banks' | 'invoices' | 'setup-buckets' | 'invite-team'>('welcome');
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [invoicePreference, setInvoicePreference] = useState<'yes' | 'no' | null>(null);

  if (currentStep === 'welcome') {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-12">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-balance leading-tight">
              Welcome to Warrior Finance
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Know where your money is. Know where it should go.
            </p>
          </div>

          {/* Benefits Bullets */}
          <div className="space-y-4">
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-2.5" />
                <span className="text-sm text-foreground leading-relaxed">
                  See cash in one place
                </span>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-2.5" />
                <span className="text-sm text-foreground leading-relaxed">
                  Automatically separate tax, expenses, and profit
                </span>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-2.5" />
                <span className="text-sm text-foreground leading-relaxed">
                  Get early warning before money stress hits
                </span>
              </li>
            </ul>
          </div>

          {/* Primary CTA */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => setCurrentStep('connect-banks')}
              className="w-full"
            >
              Start Setup
            </Button>

            {/* Secondary CTA */}
            <button
              onClick={onComplete}
              className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (currentStep === 'connect-banks') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* Progress Indicator */}
          <div className="mb-12 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step 1 of 4
              </p>
              <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-primary rounded-full" />
              </div>
            </div>
            <button
              onClick={onComplete}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            {/* Left Column */}
            <div className="max-w-md space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-foreground">
                  Connect your bank accounts
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  This is how Warrior Finance understands your cash.
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <button
                  onClick={() => {/* Handle file upload */}}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-background hover:bg-muted/40 transition-colors text-left"
                >
                  <Upload size={18} className="text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload Bank Statement</p>
                    <p className="text-xs text-muted-foreground">CSV or Excel</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowAccountForm(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-background hover:bg-muted/40 transition-colors text-left"
                >
                  <Plus size={18} className="text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Add Account Manually</p>
                    <p className="text-xs text-muted-foreground">View-only connection</p>
                  </div>
                </button>
              </div>

              {/* Microcopy */}
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  You can add multiple accounts later.
                </p>
                <p className="text-xs text-muted-foreground">
                  We never move money. This is view-only.
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="border border-border rounded-lg p-8 bg-muted/20 flex flex-col items-center justify-center min-h-80">
              {connectedAccounts.length === 0 ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">No accounts connected yet</p>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  {connectedAccounts.map((account) => (
                    <div key={account.id} className="p-4 bg-background border border-border rounded-lg">
                      <p className="text-sm font-medium text-foreground">{account.accountName}</p>
                      <p className="text-xs text-muted-foreground">{account.bankName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-12 border-t border-border">
            <Button
              onClick={() => setCurrentStep('invoices')}
              className="w-full"
            >
              Upload Statement
            </Button>
            <button
              onClick={() => setCurrentStep('invoices')}
              className="px-6 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Add Account Manual Modal */}
          {showAccountForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background border border-border rounded-lg max-w-md w-full mx-4 shadow-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">Add Bank Account</h2>
                  <button
                    onClick={() => setShowAccountForm(false)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Account Name</label>
                    <input
                      type="text"
                      placeholder="e.g., HDFC – Current"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g., HDFC Bank"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Account Type</label>
                    <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                      <option value="current">Current Account</option>
                      <option value="savings">Savings Account</option>
                      <option value="credit-card">Credit Card</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
                  <button
                    onClick={() => setShowAccountForm(false)}
                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={() => {
                      const newAccount: ConnectedAccount = {
                        id: Date.now().toString(),
                        accountName: 'New Account',
                        bankName: 'Bank Name',
                        accountType: 'current',
                      };
                      setConnectedAccounts([...connectedAccounts, newAccount]);
                      setShowAccountForm(false);
                    }}
                  >
                    Add Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (currentStep === 'invoices') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* Progress Indicator */}
          <div className="mb-12 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step 3 of 4
              </p>
              <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-primary rounded-full" />
              </div>
            </div>
            <button
              onClick={onComplete}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Content */}
          {invoicePreference === null ? (
            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-12">
                {/* Title */}
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold text-foreground">
                    Do you want to track invoices?
                  </h1>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Optional. You can always add invoices later.
                  </p>
                </div>

                {/* Two Option Buttons */}
                <div className="space-y-4">
                  <button
                    onClick={() => setInvoicePreference('yes')}
                    className="w-full px-8 py-6 border-2 border-border rounded-lg bg-background hover:border-primary hover:bg-primary/5 transition-colors text-left group"
                  >
                    <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      Yes, I send invoices
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Track receivables and payables
                    </p>
                  </button>

                  <button
                    onClick={() => setInvoicePreference('no')}
                    className="w-full px-8 py-6 border-2 border-border rounded-lg bg-background hover:border-border hover:bg-muted/20 transition-colors text-left group"
                  >
                    <h2 className="text-lg font-semibold text-foreground">
                      No, I don't
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Skip this step for now
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : invoicePreference === 'yes' ? (
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-foreground">
                  Add your invoices
                </h1>
                <p className="text-base text-muted-foreground">
                  Track what customers owe you and what you owe vendors.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Button className="w-full">
                  Add Invoice
                </Button>
                <button
                  onClick={() => setCurrentStep('setup-buckets')}
                  className="w-full px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Import Later
                </button>
              </div>

              {/* Microcopy */}
              <p className="text-xs text-muted-foreground text-center">
                You can always add invoices later.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center space-y-8">
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-foreground">
                  Skipping invoices
                </h1>
                <p className="text-base text-muted-foreground">
                  You can add them anytime from your dashboard.
                </p>
              </div>

              {/* CTA */}
              <Button
                onClick={() => setCurrentStep('setup-buckets')}
                className="w-full"
              >
                Continue Setup
              </Button>

              {/* Microcopy */}
              <p className="text-xs text-muted-foreground">
                You can always add invoices later.
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // For future steps (setup-buckets, invite-team), we'll add them later
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">Step {currentStep === 'setup-buckets' ? '2' : '3'}</h1>
        <p className="text-muted-foreground">Coming soon</p>
        <Button onClick={onComplete} className="w-full">
          Complete Setup
        </Button>
      </div>
    </main>
  );
}
