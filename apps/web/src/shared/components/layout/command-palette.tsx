'use client';

import { useUIStore } from '@/shared/stores/ui-store';
import { Badge } from '@/shared/ui/badge';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/shared/ui/command';
import {
  ArrowUpDown,
  BarChart3,
  BookOpenCheck,
  CornerDownLeft,
  CreditCard,
  FileSpreadsheet,
  GraduationCap,
  Laptop,
  LayoutDashboard,
  Moon,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Users2,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [search, setSearch] = useState('');

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!commandPaletteOpen) {
      setSearch('');
    }
  }, [commandPaletteOpen]);

  // Listen for global ⌘K and Ctrl+K shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const runCommand = useCallback(
    (command: () => void) => {
      setCommandPaletteOpen(false);
      command();
    },
    [setCommandPaletteOpen],
  );

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      title="Quick Navigation & Commands"
      description="Search quizzes, rooms, navigation links and system actions"
      className="max-w-xl sm:max-w-2xl rounded-2xl shadow-2xl overflow-hidden border bg-popover"
    >
      <Command className="rounded-none border-none shadow-none">
        <div className="relative">
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search for pages, rooms, actions..."
          />
          {/* 1-Click Quick Clear Search Button */}
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        <CommandList className="max-h-95 p-2">
          <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
            No results found for &ldquo;
            <span className="text-foreground font-medium">{search}</span>
            &rdquo;.
          </CommandEmpty>

          {/* 1. Assessments & Exam Rooms */}
          <CommandGroup
            heading="Assessments & Rooms"
            className="text-xs font-semibold text-muted-foreground px-2 py-1"
          >
            <CommandItem
              onSelect={() => runCommand(() => router.push('/dashboard'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <LayoutDashboard className="size-4 text-muted-foreground" />
              <span className="font-medium">Dashboard Overview</span>
              <CommandShortcut>G D</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/quizzes'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <BookOpenCheck className="size-4 text-muted-foreground" />
              <span className="font-medium">Quiz Bank & Question Editor</span>
              <CommandShortcut>G Q</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/rooms'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <Radio className="size-4 text-primary" />
              <span className="font-medium">Live Exam Rooms</span>
              <Badge variant="default" className="text-[10px] h-4 px-1.5 py-0 font-semibold">
                Live
              </Badge>
              <CommandShortcut>G R</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/ai-generate'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <Sparkles className="size-4 text-primary" />
              <span className="font-medium">AI Quiz Generator</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 font-semibold">
                AI
              </Badge>
              <CommandShortcut>⌘ J</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-1.5" />

          {/* 2. Classes & Candidates */}
          <CommandGroup
            heading="Classes & Candidates"
            className="text-xs font-semibold text-muted-foreground px-2 py-1"
          >
            <CommandItem
              onSelect={() => runCommand(() => router.push('/classes'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <Users2 className="size-4 text-muted-foreground" />
              <span className="font-medium">Classes & Exam Groups</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/candidates'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <GraduationCap className="size-4 text-muted-foreground" />
              <span className="font-medium">Candidates & Students</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/results'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              <span className="font-medium">Exam Results & Scorecards</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/analytics'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <BarChart3 className="size-4 text-muted-foreground" />
              <span className="font-medium">Analytics & Performance Reports</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-1.5" />

          {/* 3. System & Settings */}
          <CommandGroup
            heading="System & Preferences"
            className="text-xs font-semibold text-muted-foreground px-2 py-1"
          >
            <CommandItem
              onSelect={() => runCommand(() => router.push('/audit-logs'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <ShieldCheck className="size-4 text-muted-foreground" />
              <span className="font-medium">Security & Audit Logs</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/settings'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <Settings className="size-4 text-muted-foreground" />
              <span className="font-medium">System Settings</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push('/settings/billing'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <CreditCard className="size-4 text-muted-foreground" />
              <span className="font-medium">Subscription & AI Quota</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-1.5" />

          {/* 4. Theme Switching Actions */}
          <CommandGroup
            heading="Appearance"
            className="text-xs font-semibold text-muted-foreground px-2 py-1"
          >
            <CommandItem
              onSelect={() => runCommand(() => setTheme('light'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <Sun className="size-4 text-muted-foreground" />
              <span className="font-medium">Switch to Light Theme</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setTheme('dark'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <Moon className="size-4 text-muted-foreground" />
              <span className="font-medium">Switch to Dark Theme</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setTheme('system'))}
              className="cursor-pointer gap-2 px-3 py-2 rounded-lg text-xs"
            >
              <Laptop className="size-4 text-muted-foreground" />
              <span className="font-medium">Sync with System Theme</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        {/* Navigation Footer Hints */}
        <div className="flex items-center justify-between border-t border-border/80 px-4 py-2.5 bg-muted/20 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border bg-background font-mono text-[10px] font-medium shadow-2xs">
                <ArrowUpDown className="inline size-3" />
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border bg-background font-mono text-[10px] font-medium shadow-2xs">
                <CornerDownLeft className="inline size-3" />
              </kbd>
              <span>Select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border bg-background font-mono text-[10px] font-medium shadow-2xs">
              ESC
            </kbd>
            <span>Close</span>
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
