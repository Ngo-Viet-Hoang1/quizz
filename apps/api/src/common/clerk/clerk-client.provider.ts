import { ConfigService } from '@nestjs/config';
import { ClerkClient, createClerkClient } from '@clerk/backend';

export const CLERK_CLIENT = 'CLERK_CLIENT';

export const ClerkClientProvider = {
  provide: CLERK_CLIENT,
  useFactory: (configService: ConfigService): ClerkClient => {
    return createClerkClient({
      publishableKey: configService.get<string>('CLERK_PUBLISHABLE_KEY'),
      secretKey: configService.get<string>('CLERK_SECRET_KEY'),
    });
  },
  inject: [ConfigService],
};
