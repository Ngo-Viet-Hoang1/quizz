import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationMemberResponseDto {
  @ApiProperty({
    example: '66a1234567890abcdef12345',
    description: 'MongoDB ObjectId of the organization membership record',
  })
  _id!: string;

  @ApiProperty({
    example: 'user_2xyz1234567890',
    description: 'Clerk User ID of the member',
  })
  userId!: string;

  @ApiProperty({
    example: 'org_3abc1234567890',
    description: 'Clerk Organization ID',
  })
  organizationId!: string;

  @ApiProperty({
    example: 'org:teacher',
    enum: ['org:admin', 'org:teacher', 'org:member'],
    description: 'Assigned role within the organization',
  })
  role!: string;

  @ApiProperty({
    type: [String],
    example: ['quizzes:create', 'quizzes:read'],
    description: 'Resolved fine-grained permissions associated with this member role',
  })
  permissions!: string[];

  @ApiProperty({
    example: 'active',
    enum: ['active', 'removed'],
    description: 'Membership status',
  })
  status!: 'active' | 'removed';

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Full display name of the member',
  })
  fullName!: string;

  @ApiPropertyOptional({
    example: 'teacher@school.edu.vn',
    nullable: true,
    description: 'Primary email address of the member',
  })
  email!: string | null;

  @ApiPropertyOptional({
    example: 'https://img.clerk.com/avatar.png',
    nullable: true,
    description: 'Profile avatar image URL of the member',
  })
  avatarUrl!: string | null;

  @ApiProperty({
    example: '2026-08-20T10:00:00.000Z',
    description: 'Timestamp when the user joined the organization',
  })
  joinedAt!: Date;
}
