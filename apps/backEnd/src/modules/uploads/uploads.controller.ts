import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadAuthGuard } from '../../common/guards/upload-auth.guard';
import { LocalStorageAdapter } from './local-storage.adapter';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: LocalStorageAdapter) {}

  @Post()
  @UseGuards(UploadAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('缺少文件');
    }
    const stored = await this.storage.save(file);
    return { id: stored.id, url: stored.url };
  }
}
