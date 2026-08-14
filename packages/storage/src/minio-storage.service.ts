import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { IStorageService } from './storage.interface';

@Injectable()
export class MinioStorageService implements IStorageService, OnModuleInit {
  private minioClient: Client;
  private bucket: string;
  private endpoint: string;
  private logger = new Logger('MinioStorageService');

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
    const bucket = this.configService.get<string>('MINIO_BUCKET');

    if (!endpoint || !accessKey || !secretKey || !bucket) {
      throw new Error('MinIO configuration variables are missing');
    }

    this.endpoint = endpoint;
    this.bucket = bucket;

    const useSSL = endpoint.startsWith('https://');
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
    const host = cleanEndpoint.split(':')[0];
    const portString = cleanEndpoint.split(':')[1];
    const port = portString ? parseInt(portString, 10) : useSSL ? 443 : 80;

    this.minioClient = new Client({
      endPoint: host,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket);
        this.logger.log(`Bucket "${this.bucket}" created successfully.`);

        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(this.bucket, JSON.stringify(policy));
        this.logger.log(`Public read policy applied to bucket "${this.bucket}".`);
      } else {
        this.logger.log(`Bucket "${this.bucket}" already exists.`);
      }
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to initialize MinIO bucket: ${error.message}`, error.stack);
      throw err;
    }
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSizeBytes) {
      throw new BadRequestException('File size exceeds the 10MB limit.');
    }

    await this.minioClient.putObject(this.bucket, key, buffer, buffer.length, {
      'content-type': mimeType,
    });

    return key;
  }

  async delete(key: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, key);
  }

  getPublicUrl(key: string): string {
    const base = this.endpoint.startsWith('http') ? this.endpoint : `http://${this.endpoint}`;
    return `${base}/${this.bucket}/${key}`;
  }

  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    return await this.minioClient.presignedGetObject(this.bucket, key, expiresInSeconds);
  }
}
