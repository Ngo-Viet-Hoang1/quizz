'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface StatusBadgeProps {
  code: number;
  variant?: 'dot' | 'pill';
}

export function StatusBadge({ code, variant = 'dot' }: StatusBadgeProps) {
  const is2xx = code >= 200 && code < 300;
  const is4xx = code >= 400 && code < 500;

  const color = is2xx
    ? {
        dot: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]',
        text: 'text-emerald-600 dark:text-emerald-400 font-semibold',
        pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        label: 'Success',
      }
    : is4xx
      ? {
          dot: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]',
          text: 'text-amber-600 dark:text-amber-400 font-semibold',
          pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          label: 'Client Error',
        }
      : {
          dot: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]',
          text: 'text-rose-600 dark:text-rose-400 font-semibold',
          pill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          label: 'Server Error',
        };

  if (variant === 'dot') {
    return (
      <div
        className={`inline-flex items-center justify-end gap-1.5 font-mono text-xs tabular-nums ${color.text}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${color.dot} shrink-0`} />
        <span>{code}</span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-full border shadow-xs ${color.pill}`}
    >
      <span className={`size-1.5 rounded-full ${color.dot} animate-pulse`} />
      {code} • {color.label}
    </span>
  );
}

export function MethodBadge({ method }: { method?: string | null }) {
  if (!method) return null;
  const m = method.toUpperCase();

  const colors: Record<string, string> = {
    GET: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    POST: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    PUT: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    PATCH: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    DELETE: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  };

  const cls = colors[m] ?? 'bg-muted text-muted-foreground border-border/50';

  return (
    <span
      className={`inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${cls}`}
    >
      {m}
    </span>
  );
}

export function ResourceBadge({ type }: { type?: string | null }) {
  const resource = type?.toLowerCase() ?? 'system';

  const colors: Record<string, string> = {
    quiz: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    class: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    subscription: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    user: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    auth: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  };

  const cls = colors[resource] ?? 'bg-muted/60 text-foreground/80 border-border/60';

  return (
    <span
      className={`font-mono text-[11px] font-semibold capitalize px-2 py-0.5 rounded border shrink-0 ${cls}`}
    >
      {resource}
    </span>
  );
}

export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Copied ${label ?? 'value'}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ??
        'text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/80 transition-colors cursor-pointer shrink-0'
      }
      title={`Copy ${label ?? 'value'}`}
    >
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
    </button>
  );
}

export function CopyableIdentifier({
  value,
  label,
  showFull = false,
}: {
  value: string;
  label: string;
  showFull?: boolean;
}) {
  return (
    <div className="group/copy inline-flex items-center gap-1 max-w-full">
      <span
        className={`font-mono text-xs select-all text-foreground font-medium ${showFull ? 'break-all' : 'truncate'}`}
        title={value}
      >
        {value}
      </span>
      <CopyButton
        text={value}
        label={label}
        className="opacity-0 group-hover/row:opacity-100 group-hover/copy:opacity-100 focus:opacity-100 hover:text-foreground text-muted-foreground/60 transition-opacity p-0.5 rounded cursor-pointer"
      />
    </div>
  );
}
