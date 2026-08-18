import { Global, Module } from '@nestjs/common';
import { ClerkClientProvider } from './clerk-client.provider';

@Global()
@Module({
  providers: [ClerkClientProvider],
  exports: [ClerkClientProvider],
})
export class ClerkModule {}
