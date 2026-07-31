import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { StorageAdapter, StoredFile } from './storage.adapter';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly config: ConfigService) {}

  async save(file: Express.Multer.File): Promise<StoredFile> {
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? 'uploads';
    const absDir = path.isAbsolute(uploadDir) ? uploadDir : path.join(process.cwd(), uploadDir);
    await fs.mkdir(absDir, { recursive: true });
    const id = randomUUID();
    const ext = path.extname(file.originalname) || '';
    const filename = `${id}${ext}`;
    const absPath = path.join(absDir, filename);
    await fs.writeFile(absPath, file.buffer);
    return {
      id,
      path: filename,
      url: `/uploads/${filename}`,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}

/** 预留：未来实现 S3StorageAdapter 并实现同一 StorageAdapter 接口 */
export abstract class S3StorageAdapter implements StorageAdapter {
  abstract save(file: Express.Multer.File): Promise<StoredFile>;
}
