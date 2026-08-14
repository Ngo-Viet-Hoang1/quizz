export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface IStorageService {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
