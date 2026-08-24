import { ApiProperty } from '@nestjs/swagger';

export class OrganizationMemberResponseDto {
  @ApiProperty({ example: '66a1234567890abcdef12345' })
  _id!: string;

  @ApiProperty({ example: 'user_2xyz...' })
  userId!: string;

  @ApiProperty({ example: 'org_3abc...' })
  organizationId!: string;

  @ApiProperty({ example: 'org:teacher', enum: ['org:admin', 'org:teacher', 'org:member'] })
  role!: string;

  @ApiProperty({ example: ['quizzes:create', 'quizzes:read'] })
  permissions!: string[];

  @ApiProperty({ example: 'active', enum: ['active', 'removed'] })
  status!: 'active' | 'removed';

  @ApiProperty({ example: 'Nguyễn Văn A' })
  fullName!: string;

  @ApiProperty({ example: 'teacher@school.edu.vn', nullable: true })
  email!: string | null;

  @ApiProperty({ example: 'https://img.clerk.com/avatar.png', nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: '2026-08-20T10:00:00.000Z' })
  joinedAt!: Date;
}
