import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { STORAGE_PROVIDER } from "./storage.provider.interface";
import { LocalDiskStorageProvider } from "./providers/local-disk-storage.provider";
import { S3StorageProvider } from "./providers/s3-storage.provider";
import { LocalObjectController } from "./local-object.controller";

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [LocalObjectController],
  providers: [
    LocalDiskStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, LocalDiskStorageProvider],
      useFactory: (config: ConfigService, local: LocalDiskStorageProvider) =>
        config.get<string>("STORAGE_PROVIDER") === "s3"
          ? new S3StorageProvider(config)
          : local,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
