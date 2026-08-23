import { Global, Module } from '@nestjs/common';
import { S3CompatibleStorageService, STORAGE_SERVICE } from '@repo/storage';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: S3CompatibleStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
