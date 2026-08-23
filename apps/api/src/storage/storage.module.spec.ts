import { Test, TestingModule } from '@nestjs/testing';
import { StorageModule } from './storage.module';
import { STORAGE_SERVICE } from '@repo/storage';

describe('StorageModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [StorageModule],
    })
      .overrideProvider(STORAGE_SERVICE)
      .useValue({
        upload: jest.fn().mockResolvedValue('test.png'),
        delete: jest.fn().mockResolvedValue(undefined),
        getPublicUrl: jest.fn().mockReturnValue('http://localhost:9000/quiz-assets/test.png'),
        getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.com'),
      })
      .compile();
  });

  it('should compile the storage module', () => {
    expect(module).toBeDefined();
  });

  it('should provide STORAGE_SERVICE', () => {
    const storageService = module.get(STORAGE_SERVICE);
    expect(storageService).toBeDefined();
    expect(storageService.getPublicUrl('test.png')).toBe(
      'http://localhost:9000/quiz-assets/test.png',
    );
  });
});
