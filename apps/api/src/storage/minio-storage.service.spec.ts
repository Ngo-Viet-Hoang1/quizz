import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioStorageService } from '@repo/storage';

const mockClientConstructor = jest.fn();

// Mock the Minio Client
jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation((...args) => {
      mockClientConstructor(...args);
      return {
        bucketExists: jest.fn(),
        makeBucket: jest.fn(),
        setBucketPolicy: jest.fn(),
        putObject: jest.fn(),
        removeObject: jest.fn(),
        presignedGetObject: jest.fn(),
      };
    }),
  };
});

describe('MinioStorageService', () => {
  let service: MinioStorageService;
  let mockMinioClient: Record<string, jest.Mock>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
          MINIO_ENDPOINT: 'localhost:9000',
          MINIO_ACCESS_KEY: 'test-access',
          MINIO_SECRET_KEY: 'test-secret',
          MINIO_BUCKET: 'test-bucket',
        };
        return config[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new MinioStorageService(mockConfigService);
    mockMinioClient = (service as unknown as { minioClient: Record<string, jest.Mock> })
      .minioClient;
  });

  it('should construct and parse MINIO_ENDPOINT correctly', () => {
    expect(mockClientConstructor).toHaveBeenCalledWith({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'test-access',
      secretKey: 'test-secret',
    });
  });

  describe('onModuleInit', () => {
    it('should create bucket and set policy if bucket does not exist', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);
      mockMinioClient.setBucketPolicy.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('test-bucket');
      expect(mockMinioClient.setBucketPolicy).toHaveBeenCalled();
    });

    it('should skip creation if bucket exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);

      await service.onModuleInit();

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
    });

    it('should throw error if bucketExists fails', async () => {
      const dbError = new Error('Connection refused');
      mockMinioClient.bucketExists.mockRejectedValue(dbError);

      await expect(service.onModuleInit()).rejects.toThrow('Connection refused');
    });
  });

  describe('upload', () => {
    it('should upload file successfully when size is within limit', async () => {
      mockMinioClient.putObject.mockResolvedValue(undefined);
      const buffer = Buffer.alloc(5 * 1024 * 1024); // 5MB

      const key = 'test/file.png';
      const result = await service.upload(key, buffer, 'image/png');

      expect(result).toBe(key);
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        key,
        buffer,
        buffer.length,
        { 'content-type': 'image/png' },
      );
    });

    it('should throw BadRequestException if file exceeds 10MB', async () => {
      const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      await expect(service.upload('test/large.png', buffer, 'image/png')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockMinioClient.putObject).not.toHaveBeenCalled();
    });
  });

  describe('getPublicUrl', () => {
    it('should return correct public URL', () => {
      const url = service.getPublicUrl('test/file.png');
      expect(url).toBe('http://localhost:9000/test-bucket/test/file.png');
    });
  });

  describe('getSignedUrl', () => {
    it('should return signed URL from MinIO SDK', async () => {
      mockMinioClient.presignedGetObject.mockResolvedValue('https://signed-url.com');

      const url = await service.getSignedUrl('test/private.png', 3600);

      expect(url).toBe('https://signed-url.com');
      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        'test-bucket',
        'test/private.png',
        3600,
      );
    });
  });
});
