import { envSchema } from './env.schema';

describe('envSchema', () => {
  const baseValidConfig = {
    NODE_ENV: 'development',
    PORT: '4000',
    MONGODB_URI: 'mongodb://localhost:27017/quiz',
    STORAGE_ENDPOINT: 'http://localhost:9000',
    STORAGE_ACCESS_KEY: 'minioadmin',
    STORAGE_SECRET_KEY: 'minioadmin',
    STORAGE_FORCE_PATH_STYLE: 'true',
    CLERK_SECRET_KEY: 'sk_test_123',
    CLERK_PUBLISHABLE_KEY: 'pk_test_123',
    CLERK_WEBHOOK_SECRET: 'whsec_123',
  };

  it('should successfully parse valid configuration and assign defaults', () => {
    const result = envSchema.safeParse(baseValidConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(4000);
      expect(result.data.SEPAY_BANK_ID).toBe('MBBank');
      expect(result.data.SEPAY_ACCOUNT_NUMBER).toBe('0000000001');
      expect(result.data.SEPAY_ACCOUNT_NAME).toBe('LE PHI VU');
      expect(result.data.SEPAY_API_KEY).toBeUndefined();
    }
  });

  it('should accept custom SePay settings when provided', () => {
    const result = envSchema.safeParse({
      ...baseValidConfig,
      SEPAY_API_KEY: 'custom_api_key_123',
      SEPAY_WEBHOOK_SECRET: 'custom_secret_456',
      SEPAY_BANK_ID: 'Vietcombank',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.SEPAY_API_KEY).toBe('custom_api_key_123');
      expect(result.data.SEPAY_WEBHOOK_SECRET).toBe('custom_secret_456');
      expect(result.data.SEPAY_BANK_ID).toBe('Vietcombank');
    }
  });
});
