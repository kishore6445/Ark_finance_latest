'use client';

import { useState } from 'react';
import { useOrganization } from '@/context/organization-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, ChevronDown, Plus } from 'lucide-react';

interface OrganizationSwitcherProps {
  onCreateNew: () => void;
}

export function OrganizationSwitcher({ onCreateNew }: OrganizationSwitcherProps) {
  const { organizations, currentOrganization, switchOrganization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);

  if (!organizations.length) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={onCreateNew} size="sm" className="gap-2">
          <Plus size={16} />
          New Organization
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
      >
        <Building2 size={18} />
        <span className="font-medium text-sm truncate max-w-xs">{currentOrganization?.name}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-80 shadow-lg z-50">
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Organizations</p>

            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  switchOrganization(org.id);
                  setIsOpen(false);
                }}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  currentOrganization?.id === org.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-border hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{org.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{org.type}</p>
                    <p className="text-xs text-muted-foreground">{org.email}</p>
                  </div>
                  {currentOrganization?.id === org.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </button>
            ))}

            <div className="border-t border-border pt-3">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew();
                }}
                variant="outline"
                size="sm"
                className="w-full gap-2"
              >
                <Plus size={16} />
                Create New Organization
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
