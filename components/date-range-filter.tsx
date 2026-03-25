'use client';

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DateRange {
  start: string;
  end: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  showPresets?: boolean;
}

export function DateRangeFilter({ value, onChange, showPresets = true }: DateRangeFilterProps) {
  const [showPicker, setShowPicker] = useState(false);

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const presets = [
    {
      label: 'Today',
      get range() {
        const today = new Date().toISOString().split('T')[0];
        return { start: today, end: today };
      },
    },
    {
      label: 'This Month',
      range: {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0],
      },
    },
    {
      label: 'Last 30 Days',
      get range() {
        const end = new Date();
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      },
    },
    {
      label: 'Last 90 Days',
      get range() {
        const end = new Date();
        const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      },
    },
    {
      label: 'This Year',
      range: {
        start: startOfYear.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0],
      },
    },
  ];

  const handlePreset = (preset: (typeof presets)[0]) => {
    onChange(preset.range);
    setShowPicker(false);
  };

  const handlePreviousPeriod = () => {
    const start = new Date(value.start);
    const end = new Date(value.end);
    const rangeLength = end.getTime() - start.getTime();

    const newEnd = new Date(start.getTime() - 1);
    const newStart = new Date(newEnd.getTime() - rangeLength);

    onChange({
      start: newStart.toISOString().split('T')[0],
      end: newEnd.toISOString().split('T')[0],
    });
  };

  const handleNextPeriod = () => {
    const start = new Date(value.start);
    const end = new Date(value.end);
    const rangeLength = end.getTime() - start.getTime();

    const newStart = new Date(end.getTime() + 1);
    const newEnd = new Date(newStart.getTime() + rangeLength);

    onChange({
      start: newStart.toISOString().split('T')[0],
      end: newEnd.toISOString().split('T')[0],
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-3">
      {/* Main Input */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePreviousPeriod}
          className="p-2 rounded border border-border hover:bg-muted transition-colors"
          title="Previous period"
        >
          <ChevronLeft size={16} className="text-muted-foreground" />
        </button>

        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex-1 flex items-center justify-between px-4 py-2 border border-border rounded bg-input hover:border-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">
              {formatDate(value.start)} — {formatDate(value.end)}
            </span>
          </div>
        </button>

        <button
          onClick={handleNextPeriod}
          className="p-2 rounded border border-border hover:bg-muted transition-colors"
          title="Next period"
        >
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Preset Buttons */}
      {showPicker && showPresets && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className="px-3 py-1 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Manual Input */}
      {showPicker && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded border border-border">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
            <input
              type="date"
              value={value.start}
              onChange={(e) => onChange({ ...value, start: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-input focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
            <input
              type="date"
              value={value.end}
              onChange={(e) => onChange({ ...value, end: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-input focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
