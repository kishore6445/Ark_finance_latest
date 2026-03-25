'use client';

import { useState } from 'react';
import { useOrganization } from '@/context/organization-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Building2 } from 'lucide-react';

interface CreateOrganizationScreenProps {
  onComplete: () => void;
}

export function CreateOrganizationScreen({ onComplete }: CreateOrganizationScreenProps) {
  const { createOrganization } = useOrganization();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ownerSetupLink, setOwnerSetupLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Company' as const,
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    fiscalYearStart: 4,
    fiscalYearEnd: 3,
    currency: 'INR' as const,
    inventoryManagementEnabled: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Organization name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setOwnerSetupLink(null);

    // Create a default demo organization
    try {
      const result = await createOrganization({
        name: 'Demo Organization',
        type: 'Company',
        email: 'demo@warriorfinance.com',
        phone: '+91 98765 43210',
        gstin: '22AABCU0000A1Z0',
        pan: 'ABCDE1234F',
        address: '123 Business Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        fiscalYearStart: 4,
        fiscalYearEnd: 3,
        currency: 'INR',
        settings: {
          currency: 'INR',
          language: 'en',
          timezone: 'Asia/Kolkata',
          accountingStandard: 'Ind AS',
          gstEnabled: true,
          tdsEnabled: true,
          autoReconciliation: false,
          inventoryManagementEnabled: true,
        },
      });

      if (result.ownerSetupLink) {
        setOwnerSetupLink(result.ownerSetupLink);
        return;
      }

      onComplete();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setOwnerSetupLink(null);

    try {
      const result = await createOrganization({
        name: formData.name,
        type: formData.type,
        email: formData.email,
        phone: formData.phone,
        gstin: formData.gstin,
        pan: formData.pan,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
        fiscalYearStart: formData.fiscalYearStart,
        fiscalYearEnd: formData.fiscalYearEnd,
        currency: formData.currency,
        settings: {
          currency: formData.currency,
          language: 'en',
          timezone: 'Asia/Kolkata',
          accountingStandard: 'Ind AS',
          gstEnabled: !!formData.gstin,
          tdsEnabled: true,
          autoReconciliation: false,
          inventoryManagementEnabled: formData.inventoryManagementEnabled,
        },
      });

      if (result.ownerSetupLink) {
        setOwnerSetupLink(result.ownerSetupLink);
        return;
      }

      onComplete();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Building2 size={28} />
            <div>
              <CardTitle>Create Your Organization</CardTitle>
              <CardDescription className="text-blue-100">Step {step} of 2 - Set up your workspace</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          {submitError ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          {ownerSetupLink ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Invite email rate-limited.</p>
              <p className="mt-1">Share this owner setup link manually:</p>
              <p className="mt-2 break-all rounded border border-amber-200 bg-white px-2 py-1 text-xs">{ownerSetupLink}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(ownerSetupLink)
                  }}
                >
                  Copy Link
                </Button>
                <Button type="button" onClick={onComplete}>
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <Input
                    placeholder="Acme Corporation"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Sole Proprietor">Sole Proprietor</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Company">Company</option>
                    <option value="LLP">LLP</option>
                    <option value="NGO">NGO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="contact@acme.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    GSTIN (Optional)
                  </label>
                  <Input
                    placeholder="22ABCDE0000A1Z0"
                    value={formData.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    PAN (Optional)
                  </label>
                  <Input
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    onChange={(e) => handleChange('pan', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inventoryManagementEnabled}
                    onChange={(e) => handleChange('inventoryManagementEnabled', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-700">Enable Inventory Management</p>
                    <p className="text-sm text-gray-500">Add stock management, inventory tracking, and valuation features</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 justify-between pt-6">
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Skip for Now
                </button>
                <div className="flex gap-3">
                  <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
                  <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                    Next <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <Input
                  placeholder="123 Business Street"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    placeholder="Mumbai"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State
                  </label>
                  <Input
                    placeholder="Maharashtra"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pin Code
                  </label>
                  <Input
                    placeholder="400001"
                    value={formData.pinCode}
                    onChange={(e) => handleChange('pinCode', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fiscal Year Start (Month)
                  </label>
                  <select
                    value={formData.fiscalYearStart}
                    onChange={(e) => handleChange('fiscalYearStart', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        Month {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fiscal Year End (Month)
                  </label>
                  <select
                    value={formData.fiscalYearEnd}
                    onChange={(e) => handleChange('fiscalYearEnd', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        Month {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INR">INR (Indian Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-6">
                <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                  Back
                </Button>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Organization'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
