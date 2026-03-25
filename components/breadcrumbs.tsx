'use client';

import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight size={16} className="text-muted-foreground mx-1" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <button
                onClick={item.onClick}
                className="text-muted-foreground hover:text-foreground transition-colors underline"
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
