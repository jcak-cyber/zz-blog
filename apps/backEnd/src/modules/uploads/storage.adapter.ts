export interface StoredFile {
  id: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface StorageAdapter {
  save(file: Express.Multer.File): Promise<StoredFile>;
  /** 按公开 url（如 /uploads/xxx.jpg）删除本地文件；不存在则忽略 */
  removeByUrl(url: string): Promise<boolean>;
}
