import { AiGenerationJobStatus } from '../enums';
import { AiGenerationJob, AiGenerationJobSchema } from './ai-generation-job.schema';

describe('AiGenerationJobSchema', () => {
  it('should define correct schema indexes', () => {
    const indexes = AiGenerationJobSchema.indexes();

    const hasOrgCreatedAtIdx = indexes.some(
      ([fields]) => fields.organizationId === 1 && fields.createdAt === -1,
    );

    const hasOrgIdempotencyUniqueIdx = indexes.some(
      ([fields, options]) =>
        fields.organizationId === 1 && fields.idempotencyKey === 1 && options?.unique === true,
    );

    expect(hasOrgCreatedAtIdx).toBe(true);
    expect(hasOrgIdempotencyUniqueIdx).toBe(true);
  });

  it('should instantiate AiGenerationJob object with proper values', () => {
    const job: AiGenerationJob = {
      organizationId: 'org_test_123',
      userId: 'user_test_456',
      idempotencyKey: 'idemp_key_789',
      prompt: 'Create 5 questions on TypeScript',
      questionCount: 5,
      model: 'claude-3-5-haiku-20241022',
      status: AiGenerationJobStatus.PENDING,
    };

    expect(job.organizationId).toBe('org_test_123');
    expect(job.userId).toBe('user_test_456');
    expect(job.idempotencyKey).toBe('idemp_key_789');
    expect(job.prompt).toBe('Create 5 questions on TypeScript');
    expect(job.questionCount).toBe(5);
    expect(job.model).toBe('claude-3-5-haiku-20241022');
    expect(job.status).toBe(AiGenerationJobStatus.PENDING);
  });
});
