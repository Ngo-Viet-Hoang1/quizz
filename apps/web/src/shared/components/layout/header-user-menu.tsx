'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useClerk, useUser } from '@clerk/nextjs';
import { CreditCard, LogOut, User as UserIcon } from 'lucide-react';
import { ThemeDropdownSub } from './theme-dropdown-sub';

export function HeaderUserMenu() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  if (!user) return null;

  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n?.[0]?.toUpperCase())
      .join('') ||
    user.username?.[0]?.toUpperCase() ||
    'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-primary/40 focus:ring-2 focus:ring-primary/50 transition-all outline-none cursor-pointer"
          >
            <Avatar size="sm" className="h-8 w-8 rounded-full border shadow-2xs">
              <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
              <AvatarFallback className="rounded-full bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Open user menu</span>
          </button>
        }
      />
      <DropdownMenuContent
        className="w-56 rounded-xl shadow-lg border p-1"
        align="end"
        sideOffset={8}
      >
        {/* User Info Header */}
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex items-center gap-2.5 text-left text-sm">
            <Avatar size="sm" className="h-8 w-8 rounded-full border">
              <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
              <AvatarFallback className="rounded-full bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
              <span className="truncate font-semibold text-foreground">
                {user.fullName || user.username || 'User'}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {user.primaryEmailAddress?.emailAddress || ''}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => openUserProfile()}
            className="cursor-pointer gap-2 px-2.5 py-1.5 text-xs"
          >
            <UserIcon className="size-4 text-muted-foreground" />
            <span>Profile & Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openUserProfile()}
            className="cursor-pointer gap-2 px-2.5 py-1.5 text-xs"
          >
            <CreditCard className="size-4 text-muted-foreground" />
            <span>Billing & Plans</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Modular Theme Submenu Component */}
        <DropdownMenuGroup>
          <ThemeDropdownSub />
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout Action */}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ redirectUrl: '/' })}
          className="cursor-pointer gap-2 px-2.5 py-1.5 text-xs"
        >
          <LogOut className="size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
