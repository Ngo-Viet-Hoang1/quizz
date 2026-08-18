import { ClerkClient, verifyToken } from '@clerk/backend';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../modules/users/users.service';
import { CLERK_CLIENT } from '../clerk/clerk-client.provider';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly secretKey: string | undefined;

  constructor(
    @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
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

    let payload: { sub: string };
    try {
      payload = (await verifyToken(token, {
        secretKey: this.secretKey,
        clockSkewInMs: 5000,
      })) as unknown as {
        sub: string;
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token: missing subject claim');
    }

    let localUser = await this.usersService.findByClerkUserId(payload.sub);

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
            clerkUserId: clerkUser.id,
            email: primaryEmail,
            fullName,
            avatarUrl: clerkUser.imageUrl ?? null,
          });
        }
      } catch {
        localUser = await this.usersService.findByClerkUserId(payload.sub);
      }
    }

    if (!localUser) {
      throw new UnauthorizedException('User not found in local database or account is blocked');
    }

    if (localUser.status === 'blocked') {
      throw new ForbiddenException('Your account has been blocked');
    }

    (request as Request & { user: typeof localUser }).user = localUser;
    return true;
  }
}
