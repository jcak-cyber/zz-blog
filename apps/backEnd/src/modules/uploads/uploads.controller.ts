import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { memoryStorage } from 'multer';
import { UploadAuthGuard } from '../../common/guards/upload-auth.guard';
import { LocalStorageAdapter } from './local-storage.adapter';

class DeleteUploadDto {
  @IsString()
  @MinLength(1)
  url!: string;
}

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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('缺少文件');
    }
    const stored = await this.storage.save(file);
    return { id: stored.id, url: stored.url };
  }

  @Delete()
  @HttpCode(204)
  @UseGuards(UploadAuthGuard)
  @ApiBearerAuth()
  async remove(@Body() dto: DeleteUploadDto) {
    if (!dto?.url?.trim()) {
      throw new BadRequestException('缺少 url');
    }
    await this.storage.removeByUrl(dto.url);
  }
}
