import { ClerkClient, verifyToken } from '@clerk/backend';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { OrganizationMembersService } from '../../modules/organization-members/organization-members.service';
import { OrganizationsService } from '../../modules/organizations/organizations.service';
import { UsersService } from '../../modules/users/users.service';
import { CLERK_CLIENT } from '../clerk/clerk-client.provider';
import { AuthenticatedRequest, AuthContext } from '../interfaces/authenticated-request.interface';

interface ClerkJwtPayload {
  sub: string;
  org_id?: string;
  org_role?: string;
  org_permissions?: string[];
  [key: string]: unknown;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly secretKey: string | undefined;

  constructor(
    @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Optional() private readonly organizationsService?: OrganizationsService,
    @Optional() private readonly orgMembersService?: OrganizationMembersService,
  ) {
    this.secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!this.secretKey) {
      throw new UnauthorizedException('Clerk secret key is not configured');
    }

    let payload: ClerkJwtPayload;
    try {
      payload = await verifyToken(token, {
        secretKey: this.secretKey,
        clockSkewInMs: 5000,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token: missing subject claim');
    }

    let localUser = await this.usersService.findById(payload.sub);

    // Sync clerk user if not found in local db
    if (!localUser) {
      try {
        const clerkUser = await this.clerkClient.users.getUser(payload.sub);
        if (clerkUser) {
          const primaryEmail =
            clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)
              ?.emailAddress ??
            clerkUser.emailAddresses?.[0]?.emailAddress ??
            null;

          const fullName =
            [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
            clerkUser.username ||
            'User';

          localUser = await this.usersService.syncFromClerk({
            userId: clerkUser.id,
            email: primaryEmail,
            fullName,
            avatarUrl: clerkUser.imageUrl ?? null,
          });
        }
      } catch (error) {
        this.logger.warn(
          `Failed to JIT sync user from Clerk (${payload.sub}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        localUser = await this.usersService.findById(payload.sub);
      }
    }

    if (!localUser) {
      throw new UnauthorizedException('User not found in local database or account is blocked');
    }

    if (localUser.status === 'blocked') {
      throw new ForbiddenException('Your account has been blocked');
    }

    const rawOrg = payload.o as { id?: string; rol?: string } | undefined;
    const orgId = payload.org_id ?? rawOrg?.id ?? null;
    const orgRole = payload.org_role ?? rawOrg?.rol ?? null;

    // Auto-link active organizationId to user.organizationIds and JIT sync Organization if missing
    if (orgId) {
      if (!localUser.organizationIds?.includes(orgId)) {
        const updatedUser = await this.usersService.addOrganization(localUser._id, orgId);
        if (updatedUser) {
          localUser = updatedUser;
        }
      }

      if (this.organizationsService) {
        const localOrg = await this.organizationsService.findById(orgId);
        if (!localOrg) {
          try {
            const clerkOrg = await this.clerkClient.organizations.getOrganization({
              organizationId: orgId,
            });
            if (clerkOrg) {
              await this.organizationsService.syncFromClerk({
                id: clerkOrg.id,
                name: clerkOrg.name,
                slug: clerkOrg.slug ?? null,
                logoUrl: clerkOrg.imageUrl ?? null,
              });
            }
          } catch (error) {
            this.logger.warn(
              `Failed to JIT sync organization from Clerk (${orgId}): ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }
      }

      // JIT Sync OrganizationMember if member record is not yet in database
      if (this.orgMembersService) {
        const localMember = await this.orgMembersService.findByOrgAndUser(orgId, localUser._id);
        if (!localMember) {
          try {
            await this.orgMembersService.syncMember({
              organizationId: orgId,
              userId: localUser._id,
              role: orgRole,
            });
          } catch (error) {
            this.logger.warn(
              `Failed to JIT sync organization member from Clerk (${orgId}, ${localUser._id}): ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }
      }
    }

    const authContext: AuthContext = {
      orgId,
      orgRole,
      orgPermissions: payload.org_permissions ?? [],
      userId: localUser._id,
      user: localUser,
    };

    const authenticatedReq = request as AuthenticatedRequest;
    authenticatedReq.auth = authContext;
    authenticatedReq.user = localUser;

    return true;
  }
}
