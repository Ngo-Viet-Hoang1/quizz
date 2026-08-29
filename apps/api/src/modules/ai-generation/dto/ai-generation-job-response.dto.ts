import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiGenerationJobStatus } from '../enums';

export class EnqueueJobResponseDto {
  @ApiProperty({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID of the created job document',
  })
  jobId!: string;

  @ApiProperty({
    enum: AiGenerationJobStatus,
    example: AiGenerationJobStatus.PENDING,
    description: 'Initial job status',
  })
  status!: string;

  @ApiPropertyOptional({
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
    nullable: true,
    description: 'Quiz ID (populated when job is COMPLETED)',
  })
  quizId?: string | null;
}

export class GetJobStatusResponseDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1', description: 'ID of the job document' })
  jobId!: string;

  @ApiProperty({
    enum: AiGenerationJobStatus,
    example: AiGenerationJobStatus.PROCESSING,
    description: 'Current job status',
  })
  status!: string;

  @ApiPropertyOptional({
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
    nullable: true,
    description: 'Quiz ID once COMPLETED, null otherwise',
  })
  quizId!: string | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Error message if job FAILED',
  })
  errorMessage?: string | null;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00.000Z',
    description: 'When the job was created',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:45.000Z',
    nullable: true,
    description: 'When the job completed or failed',
  })
  completedAt?: Date | null;
}
