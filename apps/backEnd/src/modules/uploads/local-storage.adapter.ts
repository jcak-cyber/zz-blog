import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { StorageAdapter, StoredFile } from './storage.adapter';

/** 仅允许 uploads 目录下的 uuid 文件名，防止路径穿越 */
const SAFE_UPLOAD_FILE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]+$/i;

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly config: ConfigService) {}

  private uploadDirAbs() {
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? 'uploads';
    return path.isAbsolute(uploadDir) ? uploadDir : path.join(process.cwd(), uploadDir);
  }

  async save(file: Express.Multer.File): Promise<StoredFile> {
    const absDir = this.uploadDirAbs();
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

  async removeByUrl(url: string): Promise<boolean> {
    const filename = this.safeFilenameFromUrl(url);
    if (!filename) {
      throw new BadRequestException('只能删除本站上传的图片');
    }
    const absPath = path.join(this.uploadDirAbs(), filename);
    const resolved = path.resolve(absPath);
    const root = path.resolve(this.uploadDirAbs());
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      throw new BadRequestException('非法文件路径');
    }
    try {
      await fs.unlink(resolved);
      return true;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === 'ENOENT') return false;
      throw err;
    }
  }

  private safeFilenameFromUrl(url: string): string | null {
    const trimmed = url.trim();
    let pathname = trimmed;
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        pathname = new URL(trimmed).pathname;
      }
    } catch {
      return null;
    }
    const base = path.basename(pathname);
    if (!SAFE_UPLOAD_FILE.test(base)) return null;
    if (!pathname.includes('/uploads/')) return null;
    return base;
  }
}

/** 预留：未来实现 S3StorageAdapter 并实现同一 StorageAdapter 接口 */
export abstract class S3StorageAdapter implements StorageAdapter {
  abstract save(file: Express.Multer.File): Promise<StoredFile>;
  abstract removeByUrl(url: string): Promise<boolean>;
}
