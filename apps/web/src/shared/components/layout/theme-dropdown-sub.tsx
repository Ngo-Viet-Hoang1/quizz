'use client';

import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/shared/ui/dropdown-menu';
import { Check, Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeDropdownSub() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="cursor-pointer gap-2 px-2.5 py-1.5 text-xs">
        {theme === 'dark' ? (
          <Moon className="size-4 text-muted-foreground" />
        ) : theme === 'light' ? (
          <Sun className="size-4 text-muted-foreground" />
        ) : (
          <Laptop className="size-4 text-muted-foreground" />
        )}
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-36 p-1 rounded-lg">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer justify-between text-xs px-2 py-1.5"
        >
          <div className="flex items-center gap-2">
            <Sun className="size-3.5" />
            <span>Light</span>
          </div>
          {theme === 'light' && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer justify-between text-xs px-2 py-1.5"
        >
          <div className="flex items-center gap-2">
            <Moon className="size-3.5" />
            <span>Dark</span>
          </div>
          {theme === 'dark' && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer justify-between text-xs px-2 py-1.5"
        >
          <div className="flex items-center gap-2">
            <Laptop className="size-3.5" />
            <span>System</span>
          </div>
          {theme === 'system' && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
