'use client';

import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { ColumnDef, RowData } from '@tanstack/react-table';
import { Check, ChevronRight, Copy } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { DataTableFeatures } from './data-table-features';

export function createSelectColumn<TData extends RowData>(): ColumnDef<DataTableFeatures, TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center w-5">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          aria-label="Select all rows"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center w-5" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

interface TextCellProps {
  value?: string | null;
  secondary?: string | null;
  mono?: boolean;
  truncate?: boolean;
  maxWidth?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function TextCell({
  value,
  secondary,
  mono = false,
  truncate = true,
  maxWidth = 'max-w-md',
  badge,
  className,
}: TextCellProps) {
  if (!value && !secondary) {
    return <span className="text-xs font-mono text-muted-foreground/50 italic">—</span>;
  }

  return (
    <div className={`flex flex-col gap-0.5 text-xs ${maxWidth} min-w-0 ${className ?? ''}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        {value ? (
          <span
            className={`text-foreground font-medium ${mono ? 'font-mono' : ''} ${
              truncate ? 'truncate' : ''
            }`}
            title={value}
          >
            {value}
          </span>
        ) : (
          <span className="text-muted-foreground/50 italic font-mono">—</span>
        )}
        {badge}
      </div>
      {secondary && (
        <span
          className={`text-muted-foreground text-[11px] ${truncate ? 'truncate' : ''}`}
          title={secondary}
        >
          {secondary}
        </span>
      )}
    </div>
  );
}

interface NumberCellProps {
  value?: number | string | null;
  unit?: string;
  format?: 'integer' | 'decimal' | 'currency' | 'none';
  highlightThresholds?: {
    warning?: number;
    danger?: number;
  };
  className?: string;
}

export function NumberCell({
  value,
  unit = '',
  format = 'none',
  highlightThresholds,
  className,
}: NumberCellProps) {
  if (value === null || value === undefined || value === '') {
    return <div className="text-right font-mono text-xs text-muted-foreground/50">—</div>;
  }

  const numVal = typeof value === 'number' ? value : parseFloat(value);
  let colorClass = 'text-foreground font-medium';

  if (!isNaN(numVal) && highlightThresholds) {
    if (highlightThresholds.danger !== undefined && numVal >= highlightThresholds.danger) {
      colorClass = 'text-rose-600 dark:text-rose-400 font-semibold';
    } else if (highlightThresholds.warning !== undefined && numVal >= highlightThresholds.warning) {
      colorClass = 'text-amber-600 dark:text-amber-400 font-semibold';
    } else {
      colorClass = 'text-emerald-600 dark:text-emerald-400 font-semibold';
    }
  }

  let formattedValue: string = String(value);
  if (!isNaN(numVal)) {
    if (format === 'integer') formattedValue = Math.round(numVal).toLocaleString();
    else if (format === 'decimal')
      formattedValue = numVal.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      });
    else if (format === 'currency') formattedValue = numVal.toLocaleString('vi-VN');
  }

  return (
    <div
      className={`text-right font-mono text-xs tabular-nums whitespace-nowrap ${colorClass} ${
        className ?? ''
      }`}
    >
      {formattedValue}
      {unit ? `${unit}` : ''}
    </div>
  );
}

interface DateCellProps {
  value?: string | number | Date | null;
  mode?: 'split' | 'relative' | 'full';
  className?: string;
}

export function DateCell({ value, mode = 'split', className }: DateCellProps) {
  if (!value) {
    return <span className="text-xs font-mono text-muted-foreground/50 italic">—</span>;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return <span className="text-xs font-mono text-muted-foreground/50 italic">—</span>;
  }

  if (mode === 'relative') {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let text = 'just now';
    if (diffDays > 0) text = `${diffDays}d ago`;
    else if (diffHours > 0) text = `${diffHours}h ago`;
    else if (diffMins > 0) text = `${diffMins}m ago`;

    return (
      <span
        className={`font-mono text-xs text-muted-foreground whitespace-nowrap ${className ?? ''}`}
        title={date.toLocaleString()}
      >
        {text}
      </span>
    );
  }

  if (mode === 'full') {
    return (
      <span
        className={`font-mono text-xs text-foreground whitespace-nowrap ${className ?? ''}`}
        title={date.toISOString()}
      >
        {date.toLocaleString()}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 whitespace-nowrap text-xs font-mono ${className ?? ''}`}
    >
      <span className="font-semibold text-foreground">
        {date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className="text-muted-foreground/80 text-[11px]">
        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
}

interface CopyableCellProps {
  value?: string | null;
  label?: string;
  showFull?: boolean;
  className?: string;
}

export function CopyableCell({
  value,
  label = 'value',
  showFull = false,
  className,
}: CopyableCellProps) {
  const [copied, setCopied] = React.useState(false);

  if (!value) {
    return <span className="text-[11px] text-muted-foreground/50 italic font-mono">—</span>;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`group/copy inline-flex items-center gap-1.5 max-w-full min-w-0 ${className ?? ''}`}
    >
      <span
        className={`font-mono text-xs select-all text-foreground font-medium min-w-0 ${
          showFull ? 'break-all' : 'truncate'
        }`}
        title={value}
      >
        {value}
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={handleCopy}
              className="opacity-0 group-hover/row:opacity-100 group-hover/copy:opacity-100 focus:opacity-100 hover:text-foreground text-muted-foreground/60 transition-opacity p-0.5 rounded cursor-pointer shrink-0"
              aria-label={`Copy ${label}`}
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            </button>
          }
        />
        <TooltipContent side="top">
          <span>{copied ? 'Copied!' : `Copy ${label}`}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function RowInspectButton({
  onClick,
  title = 'Inspect details',
}: {
  onClick: (e: React.MouseEvent) => void;
  title?: string;
}) {
  return (
    <div className="text-right w-8">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground/60 hover:text-foreground hover:bg-muted opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        title={title}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">{title}</span>
      </Button>
    </div>
  );
}

export function copyBulkIds<T>(items: T[], idKey: keyof T = '_id' as keyof T): void {
  const ids = items
    .map((item) => String(item[idKey] ?? ''))
    .filter(Boolean)
    .join('\n');
  navigator.clipboard.writeText(ids);
  toast.success(`Copied ${items.length} IDs to clipboard`);
}

export function exportBulkJson<T>(items: T[], filenamePrefix = 'export'): void {
  const dataStr =
    'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${filenamePrefix}-${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  toast.success(`Exported ${items.length} records as JSON`);
}
