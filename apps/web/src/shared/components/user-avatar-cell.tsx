'use client';

import * as React from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

interface UserAvatarCellProps {
  userId: string;
  showEmail?: boolean;
  showAvatar?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  badge?: React.ReactNode;
}

export function UserAvatarCell({
  userId,
  showEmail = true,
  showAvatar = true,
  size = 'default',
  className,
  badge,
}: UserAvatarCellProps) {
  const { user: currentUser } = useUser();
  const { memberships } = useOrganization({ memberships: { infinite: true } });

  const orgMember = memberships?.data?.find((m) => m.publicUserData?.userId === userId);
  const isCurrentUser = currentUser?.id === userId;

  const publicData = orgMember?.publicUserData;

  const firstName = publicData?.firstName || (isCurrentUser ? currentUser?.firstName : '');
  const lastName = publicData?.lastName || (isCurrentUser ? currentUser?.lastName : '');
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  const identifier =
    publicData?.identifier ||
    (isCurrentUser ? currentUser?.primaryEmailAddress?.emailAddress || currentUser?.username : '');
  const imageUrl = publicData?.imageUrl || (isCurrentUser ? currentUser?.imageUrl : '');

  const displayName =
    fullName || identifier || (userId ? `${userId.slice(0, 10)}...` : 'Unknown User');
  const emailOrId = identifier || (userId ? userId : '');

  const initials =
    (firstName?.[0] || '') + (lastName?.[0] || '') || displayName.slice(0, 2).toUpperCase();

  const avatarSizeClasses = {
    sm: 'size-6 text-[10px]',
    default: 'size-8 text-xs',
    lg: 'size-10 text-sm',
  };

  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      {showAvatar && (
        <Avatar
          size={size}
          className={cn('shrink-0 border border-border/50', avatarSizeClasses[size])}
        >
          {imageUrl && <AvatarImage src={imageUrl} alt={displayName} />}
          <AvatarFallback className="bg-primary/10 font-medium text-primary uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-xs text-foreground truncate">{displayName}</span>
          {isCurrentUser && (
            <Badge variant="secondary" className="px-1 py-0 text-[10px] font-mono leading-none">
              You
            </Badge>
          )}
          {badge}
        </div>

        {showEmail && emailOrId && emailOrId !== displayName && (
          <span className="text-[11px] text-muted-foreground truncate">{emailOrId}</span>
        )}
      </div>
    </div>
  );
}
