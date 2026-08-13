import { Global, Module } from '@nestjs/common';
import { STORAGE_SERVICE, MinioStorageService } from '@repo/storage';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: MinioStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
