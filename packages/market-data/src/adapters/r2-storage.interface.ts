export interface ObjectMetadata {
  key: string;
  sizeBytes: number;
  lastModified: number;
  contentType?: string;
  etag?: string;
}

export interface R2StorageService {
  uploadFile(key: string, data: Buffer | Uint8Array, contentType?: string): Promise<string>;
  downloadFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  listObjects(prefix: string, maxKeys?: number): Promise<ObjectMetadata[]>;
  getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
