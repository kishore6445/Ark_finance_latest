'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

// Organization Types
export interface Organization {
  id: string;
  name: string;
  type: 'Sole Proprietor' | 'Partnership' | 'Company' | 'LLP' | 'NGO';
  gstin?: string;
  pan?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  fiscalYearStart: number; // Month (1-12)
  fiscalYearEnd: number; // Month (1-12)
  currency: 'INR' | 'USD';
  logo?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: OrganizationMember[];
  settings: OrganizationSettings;
}

export interface OrganizationMember {
  id: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Accountant' | 'Viewer';
  joinedAt: string;
  status: 'Active' | 'Invited' | 'Inactive';
}

export interface OrganizationSettings {
  currency: 'INR' | 'USD';
  language: 'en' | 'hi';
  timezone: string;
  accountingStandard: 'Ind AS' | 'IFRS';
  gstEnabled: boolean;
  tdsEnabled: boolean;
  autoReconciliation: boolean;
  inventoryManagementEnabled: boolean;
}

export type CreateOrganizationResult = {
  organization: Organization;
  ownerInvited: boolean;
  ownerSetupLink: string | null;
};

export interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  createOrganization: (org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'members'>) => Promise<CreateOrganizationResult>;
  fetchOrganizations: () => Promise<void>;
  switchOrganization: (organizationId: string) => void;
  updateOrganization: (organizationId: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  addMember: (organizationId: string, member: Omit<OrganizationMember, 'id' | 'joinedAt'>) => void;
  removeMember: (organizationId: string, memberId: string) => void;
  updateSettings: (organizationId: string, settings: Partial<OrganizationSettings>) => void;
}

type OrganizationDbRow = {
  id: string;
  name: string;
  gst_number: string | null;
  pan_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const mapDbRowToOrganization = (row: OrganizationDbRow): Organization => ({
  id: row.id,
  name: row.name,
  type: 'Company',
  gstin: row.gst_number ?? undefined,
  pan: row.pan_number ?? undefined,
  email: row.contact_email ?? '',
  phone: row.contact_phone ?? undefined,
  address: row.address ?? undefined,
  city: row.city ?? undefined,
  state: row.state ?? undefined,
  pinCode: row.pincode ?? undefined,
  fiscalYearStart: 4,
  fiscalYearEnd: 3,
  currency: 'INR',
  logo: row.logo_url ?? undefined,
  createdAt: row.created_at ?? new Date().toISOString(),
  updatedAt: row.updated_at ?? new Date().toISOString(),
  members: [],
  settings: {
    currency: 'INR',
    language: 'en',
    timezone: 'Asia/Kolkata',
    accountingStandard: 'Ind AS',
    gstEnabled: Boolean(row.gst_number),
    tdsEnabled: true,
    autoReconciliation: false,
    inventoryManagementEnabled: true,
  },
});

const mapOrganizationToInsertPayload = (org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'members'>) => ({
  name: org.name,
  gst_number: org.gstin ?? null,
  pan_number: org.pan ?? null,
  address: org.address ?? null,
  city: org.city ?? null,
  state: org.state ?? null,
  pincode: org.pinCode ?? null,
  contact_email: org.email,
  contact_phone: org.phone ?? null,
  logo_url: org.logo ?? null,
});

const mapOrganizationToUpdatePayload = (updates: Partial<Organization>) => ({
  name: updates.name,
  gst_number: updates.gstin,
  pan_number: updates.pan,
  address: updates.address,
  city: updates.city,
  state: updates.state,
  pincode: updates.pinCode,
  contact_email: updates.email,
  contact_phone: updates.phone,
  logo_url: updates.logo,
  updated_at: new Date().toISOString(),
});

// Create the context
const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  const fetchOrganizations = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const mapped = (data as OrganizationDbRow[]).map(mapDbRowToOrganization);
    setOrganizations(mapped);
    setCurrentOrganization((prev) => prev ?? mapped[0] ?? null);
  }, []);

  const createOrganization = useCallback(async (orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'members'>) => {
    const supabase = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(sessionError.message);
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error('Missing session token. Please sign in again.');
    }

    const response = await fetch('/api/organizations/create-with-owner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: orgData.name,
        email: orgData.email,
        phone: orgData.phone,
        gstin: orgData.gstin,
        pan: orgData.pan,
        address: orgData.address,
        city: orgData.city,
        state: orgData.state,
        pinCode: orgData.pinCode,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error ?? 'Failed to create organization.');
    }

    const data = result.organization as OrganizationDbRow;
    const newOrg = mapDbRowToOrganization(data as OrganizationDbRow);

    setOrganizations((prev) => [newOrg, ...prev]);
    setCurrentOrganization(newOrg);

    return {
      organization: newOrg,
      ownerInvited: Boolean(result.ownerInvited),
      ownerSetupLink: (result.ownerSetupLink as string | null) ?? null,
    };
  }, []);

  const switchOrganization = useCallback((organizationId: string) => {
    const org = organizations.find((o) => o.id === organizationId);
    if (org) {
      setCurrentOrganization(org);
    }
  }, [organizations]);

  const updateOrganization = useCallback(async (organizationId: string, updates: Partial<Organization>) => {
    const supabase = getSupabaseClient();
    const payload = mapOrganizationToUpdatePayload(updates);

    const { error } = await supabase
      .from('organizations')
      .update(payload)
      .eq('id', organizationId);

    if (error) {
      throw new Error(error.message);
    }

    setOrganizations((prev) =>
      prev.map((org) =>
        org.id === organizationId
          ? {
              ...org,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : org
      )
    );

    if (currentOrganization?.id === organizationId) {
      setCurrentOrganization((prev) =>
        prev
          ? {
              ...prev,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    }
  }, [currentOrganization]);

  const deleteOrganization = useCallback(async (organizationId: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (error) {
      throw new Error(error.message);
    }

    setOrganizations((prev) => prev.filter((org) => org.id !== organizationId));

    if (currentOrganization?.id === organizationId) {
      setCurrentOrganization(organizations[0] || null);
    }
  }, [currentOrganization, organizations]);

  const addMember = useCallback((organizationId: string, member: Omit<OrganizationMember, 'id' | 'joinedAt'>) => {
    const newMember: OrganizationMember = {
      ...member,
      id: `member_${Date.now()}`,
      joinedAt: new Date().toISOString(),
    };

    setOrganizations((prev) =>
      prev.map((org) =>
        org.id === organizationId
          ? {
              ...org,
              members: [...org.members, newMember],
              updatedAt: new Date().toISOString(),
            }
          : org
      )
    );

    if (currentOrganization?.id === organizationId) {
      setCurrentOrganization((prev) =>
        prev
          ? {
              ...prev,
              members: [...prev.members, newMember],
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    }
  }, [currentOrganization]);

  const removeMember = useCallback((organizationId: string, memberId: string) => {
    setOrganizations((prev) =>
      prev.map((org) =>
        org.id === organizationId
          ? {
              ...org,
              members: org.members.filter((m) => m.id !== memberId),
              updatedAt: new Date().toISOString(),
            }
          : org
      )
    );

    if (currentOrganization?.id === organizationId) {
      setCurrentOrganization((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m.id !== memberId),
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    }
  }, [currentOrganization]);

  const updateSettings = useCallback((organizationId: string, settings: Partial<OrganizationSettings>) => {
    setOrganizations((prev) =>
      prev.map((org) =>
        org.id === organizationId
          ? {
              ...org,
              settings: { ...org.settings, ...settings },
              updatedAt: new Date().toISOString(),
            }
          : org
      )
    );

    if (currentOrganization?.id === organizationId) {
      setCurrentOrganization((prev) =>
        prev
          ? {
              ...prev,
              settings: { ...prev.settings, ...settings },
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    }
  }, [currentOrganization]);

  const value: OrganizationContextType = {
    organizations,
    currentOrganization,
    createOrganization,
    fetchOrganizations,
    switchOrganization,
    updateOrganization,
    deleteOrganization,
    addMember,
    removeMember,
    updateSettings,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
