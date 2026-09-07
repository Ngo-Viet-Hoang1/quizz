'use client';

import * as React from 'react';
import { Activity, Clock, Globe, Layers, Monitor, Route, Shield, User } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { AuditLogItem } from '../types';
import {
  CopyButton,
  CopyableIdentifier,
  MethodBadge,
  ResourceBadge,
  StatusBadge,
} from './audit-ui-helpers';

interface AuditDetailSheetProps {
  log: AuditLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditDetailSheet({ log, open, onOpenChange }: AuditDetailSheetProps) {
  if (!log) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6 space-y-6">
        {/* 1. Header with Colorful Status, Action Pill & UTC Timestamp */}
        <SheetHeader className="space-y-2 p-0 pr-8 sm:pr-10 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Activity className="size-3.5" />
              {log.action}
            </span>
            <MethodBadge method={log.method} />
            <StatusBadge code={log.statusCode} variant="pill" />
          </div>

          <div className="pt-1">
            <SheetTitle className="text-xl font-bold font-mono tracking-tight text-foreground">
              Audit Event Details
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <Clock className="size-3.5 text-muted-foreground/80" />
              <span>{new Date(log.timestamp).toLocaleString()}</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="font-mono text-[11px] text-muted-foreground/70">
                {new Date(log.timestamp).toUTCString()}
              </span>
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* 2. Structured Key-Value Property List */}
        <div className="rounded-xl border border-border/60 bg-card/60 dark:bg-zinc-900/40 backdrop-blur-sm divide-y divide-border/40 text-xs shadow-xs">
          {/* Endpoint */}
          <div className="flex items-center justify-between p-3.5 gap-3">
            <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-2">
              <Route className="size-3.5 text-sky-500" />
              Endpoint
            </span>
            <div className="flex items-center gap-1.5 font-mono truncate select-all">
              {log.path ? (
                <CopyableIdentifier value={log.path} label="Endpoint" />
              ) : (
                <span className="text-muted-foreground italic font-mono">—</span>
              )}
            </div>
          </div>

          {/* Resource */}
          <div className="flex items-center justify-between p-3.5 gap-3">
            <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-2">
              <Layers className="size-3.5 text-violet-500" />
              Resource
            </span>
            <div className="flex items-center gap-2 font-mono truncate select-all">
              <ResourceBadge type={log.resourceType} />
              {log.resourceId ? (
                <CopyableIdentifier value={log.resourceId} label="Resource ID" />
              ) : (
                <span className="text-muted-foreground/50 italic font-mono">—</span>
              )}
            </div>
          </div>

          {/* Actor */}
          <div className="flex items-center justify-between p-3.5 gap-3">
            <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-2">
              <User className="size-3.5 text-indigo-500" />
              Actor
            </span>
            <div className="flex items-center gap-2 font-mono truncate select-all">
              {log.userId ? (
                <CopyableIdentifier value={log.userId} label="Actor User ID" />
              ) : (
                <span className="text-muted-foreground italic font-mono">System Worker</span>
              )}
            </div>
          </div>

          {/* Network & Latency */}
          <div className="flex items-center justify-between p-3.5 gap-3">
            <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-2">
              <Globe className="size-3.5 text-teal-500" />
              Network & Latency
            </span>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 tabular-nums">
                {typeof log.durationMs === 'number' ? `${log.durationMs}ms` : '—'}
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                IP: {log.ip ?? 'Internal'}
              </span>
            </div>
          </div>

          {/* Trace ID */}
          <div className="flex items-center justify-between p-3.5 gap-3">
            <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-2">
              <Shield className="size-3.5 text-amber-500" />
              Trace ID
            </span>
            <div className="flex items-center gap-1.5 font-mono truncate select-all">
              {log.traceId ? (
                <CopyableIdentifier value={log.traceId} label="Trace ID" />
              ) : (
                <span className="text-muted-foreground/50 italic font-mono">—</span>
              )}
            </div>
          </div>

          {/* User Agent */}
          {log.userAgent && (
            <div className="p-3.5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-medium flex items-center gap-2">
                  <Monitor className="size-3.5 text-purple-500" />
                  User Agent
                </span>
                <CopyButton text={log.userAgent} label="User Agent" />
              </div>
              <p className="font-mono text-[11px] text-muted-foreground/90 break-all bg-muted/40 p-2.5 rounded-lg border border-border/50 leading-relaxed">
                {log.userAgent}
              </p>
            </div>
          )}
        </div>

        {/* 3. Metadata JSON Terminal-Style Code Box */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              Event Metadata Payload
            </span>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <CopyButton
                text={JSON.stringify(log.metadata, null, 2)}
                label="Metadata JSON"
                className="h-7 px-2.5 text-xs font-mono border border-border/80 rounded hover:bg-muted cursor-pointer inline-flex items-center gap-1.5"
              />
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 dark:bg-black p-4 overflow-x-auto text-zinc-100 font-mono text-xs max-h-[300px] overflow-y-auto shadow-inner ring-1 ring-white/5">
            {log.metadata && Object.keys(log.metadata).length > 0 ? (
              <pre className="whitespace-pre-wrap break-words leading-relaxed text-zinc-300">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            ) : (
              <span className="text-zinc-500 italic">
                No custom metadata attached to this event.
              </span>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
