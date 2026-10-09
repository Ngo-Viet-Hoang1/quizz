'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  label?: string;
  iconOnly?: boolean;
  successDuration?: number;
  onCopySuccess?: () => void;
}

export function CopyButton({
  value,
  label = 'value',
  iconOnly = true,
  successDuration = 1500,
  onCopySuccess,
  className,
  children,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied ${label}`);
      onCopySuccess?.();
      setTimeout(() => setCopied(false), successDuration);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const buttonContent = (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer select-none',
        'hover:bg-accent hover:text-accent-foreground active:scale-95',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        copied && 'text-emerald-500 hover:text-emerald-600',
        className,
      )}
      aria-label={`Copy ${label}`}
      {...props}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-500 shrink-0 animate-in zoom-in-50 duration-200" />
      ) : (
        <Copy className="size-3.5 shrink-0 opacity-70 hover:opacity-100 transition-opacity" />
      )}
      {!iconOnly && children && <span className="ml-1.5">{children}</span>}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger render={buttonContent} />
      <TooltipContent side="top" className="text-xs font-mono">
        {copied ? 'Copied!' : `Copy ${label}`}
      </TooltipContent>
    </Tooltip>
  );
}

export interface CopyableBadgeProps {
  value: string;
  prefix?: string;
  label?: string;
  className?: string;
}

export function CopyableBadge({ value, prefix, label = 'PIN', className }: CopyableBadgeProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied ${label}: ${value}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'group/copy inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
              'bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
              'font-mono text-xs font-bold hover:bg-indigo-500/20 hover:border-indigo-500/30',
              'transition-all duration-150 cursor-pointer active:scale-95 select-none',
              className,
            )}
            aria-label={`Copy ${label}`}
          >
            <span>
              {prefix ? `${prefix} ` : ''}
              {value}
            </span>
            {copied ? (
              <Check className="size-3 text-emerald-500 animate-in zoom-in-50 duration-150" />
            ) : (
              <Copy className="size-3 opacity-60 group-hover/copy:opacity-100 transition-opacity" />
            )}
          </button>
        }
      />
      <TooltipContent side="top" className="text-xs font-mono">
        {copied ? 'Copied!' : `Copy ${label}`}
      </TooltipContent>
    </Tooltip>
  );
}
