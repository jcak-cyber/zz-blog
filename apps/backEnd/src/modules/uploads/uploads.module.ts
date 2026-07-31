import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LocalStorageAdapter } from './local-storage.adapter';
import { UploadsController } from './uploads.controller';
import { UploadAuthGuard } from '../../common/guards/upload-auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [LocalStorageAdapter, UploadAuthGuard],
  exports: [LocalStorageAdapter],
})
export class UploadsModule {}
