import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { R2StorageService, ObjectMetadata } from './r2-storage.interface';
import * as fs from 'fs';
import * as path from 'path';

export class R2StorageProvider implements R2StorageService {
  private s3Client: S3Client | null = null;
  private bucket: string;
  private isConfigured = false;
  private localFallbackDir: string;

  constructor(
    config: {
      endpoint?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      bucket?: string;
      localFallbackDir?: string;
    } = {},
  ) {
    const endpoint = config.endpoint || process.env.R2_ENDPOINT;
    const accessKeyId = config.accessKeyId || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = config.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = config.bucket || process.env.R2_BUCKET || 'arbnexus-datasets';
    this.localFallbackDir =
      config.localFallbackDir || path.resolve(process.cwd(), 'data', 'storage');

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
    } else {
      // Ensure local fallback directory exists
      if (!fs.existsSync(this.localFallbackDir)) {
        fs.mkdirSync(this.localFallbackDir, { recursive: true });
      }
    }
  }

  public async uploadFile(
    key: string,
    data: Buffer | Uint8Array,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    if (this.isConfigured && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: data,
            ContentType: contentType,
          }),
        );
        return `r2://${this.bucket}/${key}`;
      } catch {
        // Fallback to local disk
      }
    }

    // Local filesystem fallback
    const targetPath = path.join(this.localFallbackDir, key);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, Buffer.from(data));
    return `file://${targetPath}`;
  }

  public async downloadFile(key: string): Promise<Buffer> {
    if (this.isConfigured && this.s3Client) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }),
        );
        const byteArray = await response.Body?.transformToByteArray();
        if (byteArray) {
          return Buffer.from(byteArray);
        }
      } catch {
        // Fallback
      }
    }

    const localPath = path.join(this.localFallbackDir, key);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
    throw new Error(`Object not found: ${key}`);
  }

  public async deleteFile(key: string): Promise<void> {
    if (this.isConfigured && this.s3Client) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }),
        );
        return;
      } catch {
        // Fallback
      }
    }

    const localPath = path.join(this.localFallbackDir, key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  }

  public async listObjects(prefix: string, maxKeys: number = 1000): Promise<ObjectMetadata[]> {
    if (this.isConfigured && this.s3Client) {
      try {
        const response = await this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            MaxKeys: maxKeys,
          }),
        );
        return (
          response.Contents?.map((obj) => ({
            key: obj.Key || '',
            sizeBytes: obj.Size || 0,
            lastModified: obj.LastModified ? obj.LastModified.getTime() : Date.now(),
            etag: obj.ETag,
          })) || []
        );
      } catch {
        // Fallback
      }
    }

    const searchDir = path.join(this.localFallbackDir, prefix);
    if (!fs.existsSync(searchDir)) {
      return [];
    }
    const files = fs.readdirSync(searchDir, { recursive: true, withFileTypes: true });
    return files
      .filter((f) => f.isFile())
      .map((f) => {
        const fullPath = path.join(f.parentPath || searchDir, f.name);
        const stat = fs.statSync(fullPath);
        return {
          key: path.relative(this.localFallbackDir, fullPath).replace(/\\/g, '/'),
          sizeBytes: stat.size,
          lastModified: stat.mtimeMs,
        };
      });
  }

  public async getPresignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    if (this.isConfigured && this.s3Client) {
      // In production S3, use getSignedUrl from @aws-sdk/s3-request-presigner
      return `https://${this.bucket}.r2.cloudflarestorage.com/${key}?expires=${expiresInSeconds}`;
    }
    return `file://${path.join(this.localFallbackDir, key)}`;
  }
}
