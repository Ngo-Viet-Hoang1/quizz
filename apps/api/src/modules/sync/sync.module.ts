import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ClerkSyncController } from './clerk/clerk-sync.controller';
import { ClerkSyncService } from './clerk/clerk-sync.service';

@Module({
  imports: [UsersModule],
  controllers: [ClerkSyncController],
  providers: [ClerkSyncService],
  exports: [ClerkSyncService],
})
export class SyncModule {}
