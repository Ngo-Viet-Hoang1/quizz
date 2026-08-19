export interface SvixHeaders {
  'svix-id'?: string;
  'svix-timestamp'?: string;
  'svix-signature'?: string;
  [key: string]: string | undefined;
}

// ─── Clerk Payload Types ───────────────────────────────────────────────────────

export interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

export interface ClerkUserData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddress[];
}

export interface ClerkUserDeletedData {
  id: string;
  deleted?: boolean;
}

export interface ClerkOrganizationData {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  created_at: number;
}

export interface ClerkOrganizationDeletedData {
  id: string;
  deleted?: boolean;
}

export interface ClerkOrgMembershipData {
  id: string;
  organization: {
    id: string;
    name: string;
    slug: string | null;
  };
  public_user_data: {
    user_id: string;
    identifier?: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
  role: string;
}

export type ClerkWebhookEvent =
  | { type: 'user.created'; data: ClerkUserData }
  | { type: 'user.updated'; data: ClerkUserData }
  | { type: 'user.deleted'; data: ClerkUserDeletedData }
  | { type: 'organization.created'; data: ClerkOrganizationData }
  | { type: 'organization.updated'; data: ClerkOrganizationData }
  | { type: 'organization.deleted'; data: ClerkOrganizationDeletedData }
  | { type: 'organizationMembership.created'; data: ClerkOrgMembershipData }
  | { type: 'organizationMembership.updated'; data: ClerkOrgMembershipData }
  | { type: 'organizationMembership.deleted'; data: ClerkOrgMembershipData };
