export interface StoredFile {
  id: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface StorageAdapter {
  save(file: Express.Multer.File): Promise<StoredFile>;
}
