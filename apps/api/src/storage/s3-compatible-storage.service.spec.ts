import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { S3CompatibleStorageService } from '@repo/storage';

describe('S3CompatibleStorageService', () => {
  let service: S3CompatibleStorageService;
  let mockSend: jest.Mock;

  const mockConfig: Record<string, string | boolean> = {
    STORAGE_ENDPOINT: 'http://localhost:9000',
    STORAGE_REGION: 'auto',
    STORAGE_ACCESS_KEY: 'test-access',
    STORAGE_SECRET_KEY: 'test-secret',
    STORAGE_BUCKET: 'test-bucket',
    STORAGE_FORCE_PATH_STYLE: true,
    STORAGE_PUBLIC_BASE_URL: 'http://localhost:9000/test-bucket',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => mockConfig[key]),
  };

  beforeEach(async () => {
    mockSend = jest.fn().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3CompatibleStorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<S3CompatibleStorageService>(S3CompatibleStorageService);
    // Mock internal S3 client
    (service as unknown as { s3: { send: jest.Mock } }).s3 = {
      send: mockSend,
    };
  });

  describe('upload', () => {
    it('should upload file successfully when size is within limit', async () => {
      const key = 'avatar.png';
      const buffer = Buffer.from('test image content');
      const mimeType = 'image/png';

      const result = await service.upload(key, buffer, mimeType);

      expect(result).toBe(key);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when file size exceeds 10MB', async () => {
      const key = 'huge-file.pdf';
      const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      await expect(service.upload(key, buffer, 'application/pdf')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete file successfully', async () => {
      const key = 'test-file.png';

      await service.delete(key);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPublicUrl', () => {
    it('should return correct public URL when publicBaseUrl is configured', () => {
      const key = 'avatar.png';
      const url = service.getPublicUrl(key);

      expect(url).toBe('http://localhost:9000/test-bucket/avatar.png');
    });

    it('should throw Error when publicBaseUrl is not configured', () => {
      (service as unknown as { publicBaseUrl?: string }).publicBaseUrl = undefined;

      expect(() => service.getPublicUrl('avatar.png')).toThrow(
        'STORAGE_PUBLIC_BASE_URL is not configured',
      );
    });
  });
});
