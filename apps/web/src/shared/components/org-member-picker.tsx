'use client';

import * as React from 'react';
import { useOrganization } from '@clerk/nextjs';
import { Check, ChevronsUpDown, Search, User, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

export interface OrgMemberOption {
  userId: string;
  name: string;
  email: string;
  imageUrl?: string;
  role?: string;
}

interface OrgMemberPickerProps {
  value: string;
  onChange: (userId: string) => void;
  excludeUserIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function OrgMemberPicker({
  value,
  onChange,
  excludeUserIds = [],
  placeholder = 'Select a member...',
  disabled = false,
  className,
}: OrgMemberPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { memberships, isLoaded } = useOrganization({
    memberships: { infinite: true },
  });

  const members: OrgMemberOption[] = React.useMemo(() => {
    if (!memberships?.data) return [];

    return memberships.data
      .map((m) => {
        const p = m.publicUserData;
        const firstName = p?.firstName || '';
        const lastName = p?.lastName || '';
        const name =
          `${firstName} ${lastName}`.trim() || p?.identifier || p?.userId || 'Unnamed User';
        const email = p?.identifier || '';
        const userId = p?.userId || '';
        const imageUrl = p?.imageUrl;
        const role = m.role ? m.role.replace('org:', '') : undefined;

        return {
          userId,
          name,
          email,
          imageUrl,
          role,
        };
      })
      .filter((m) => Boolean(m.userId));
  }, [memberships]);

  const availableMembers = React.useMemo(() => {
    return members.filter((m) => !excludeUserIds.includes(m.userId) || m.userId === value);
  }, [members, excludeUserIds, value]);

  const filteredMembers = React.useMemo(() => {
    if (!search.trim()) return availableMembers;
    const query = search.trim().toLowerCase();
    return availableMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.userId.toLowerCase().includes(query),
    );
  }, [availableMembers, search]);

  const selectedMember = React.useMemo(() => {
    return members.find((m) => m.userId === value);
  }, [members, value]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const initials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-xs transition-colors',
          'hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
          'cursor-pointer disabled:pointer-events-none disabled:opacity-50 text-left',
          isOpen && 'border-ring ring-2 ring-ring/40',
        )}
      >
        {selectedMember ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar size="sm" className="size-6 shrink-0">
              {selectedMember.imageUrl && (
                <AvatarImage src={selectedMember.imageUrl} alt={selectedMember.name} />
              )}
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {initials(selectedMember.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-xs text-foreground truncate">
                {selectedMember.name}
              </span>
              {selectedMember.email && (
                <span className="text-[11px] text-muted-foreground truncate">
                  {selectedMember.email}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground flex items-center gap-2">
            <User className="size-3.5 text-muted-foreground/70" />
            {placeholder}
          </span>
        )}
        <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0 ml-2 opacity-60" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
          {/* Search Box */}
          <div className="flex items-center border-b border-border/80 px-2.5 py-1.5">
            <Search className="size-3.5 text-muted-foreground shrink-0 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(!e.target.value.startsWith(' ') ? e.target.value : search)}
              placeholder="Search member by name or email..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Members List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/20">
            {!isLoaded ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Loading members...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {search ? 'No members match your search' : 'No available members in organization'}
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = member.userId === value;
                return (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => {
                      onChange(member.userId);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md p-2 text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted/70 text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar size="sm" className="size-7 shrink-0">
                        {member.imageUrl && <AvatarImage src={member.imageUrl} alt={member.name} />}
                        <AvatarFallback className="text-[10px] bg-muted font-medium">
                          {initials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{member.name}</span>
                        {member.email && (
                          <span className="text-[11px] text-muted-foreground truncate">
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {member.role && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 capitalize font-mono"
                        >
                          {member.role}
                        </Badge>
                      )}
                      {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
