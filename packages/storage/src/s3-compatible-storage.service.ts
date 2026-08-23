import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from './storage.interface';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Injectable()
export class S3CompatibleStorageService implements IStorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;
  private readonly logger = new Logger(S3CompatibleStorageService.name);

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('STORAGE_ENDPOINT');
    const region = this.configService.get<string>('STORAGE_REGION') || 'auto';
    const accessKeyId = this.configService.get<string>('STORAGE_ACCESS_KEY') || '';
    const secretAccessKey = this.configService.get<string>('STORAGE_SECRET_KEY') || '';
    const forcePathStyle = this.configService.get<boolean>('STORAGE_FORCE_PATH_STYLE') ?? true;

    this.bucket = this.configService.get<string>('STORAGE_BUCKET') || 'quiz-assets';
    this.publicBaseUrl = this.configService.get<string>('STORAGE_PUBLIC_BASE_URL');

    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle, // true: MinIO local | false: R2 production
      credentials: { accessKeyId, secretAccessKey },
    });

    this.logger.log(
      `Storage client initialized: endpoint=${endpoint} bucket=${this.bucket} forcePathStyle=${forcePathStyle}`,
    );
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds the 10MB limit.');
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return key;
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getPublicUrl(key: string): string {
    if (!this.publicBaseUrl) {
      throw new Error(
        'STORAGE_PUBLIC_BASE_URL is not configured. Use getSignedUrl() instead, or set the env var if the bucket is intentionally public.',
      );
    }
    return `${this.publicBaseUrl}/${key}`;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getS3SignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }
}
