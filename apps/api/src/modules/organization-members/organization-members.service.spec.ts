import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSIONS } from '@repo/shared-types';
import { OrganizationMembersService } from './organization-members.service';
import { OrganizationMember } from './schemas/organization-member.schema';

import { UsersService } from '../users/users.service';

describe('OrganizationMembersService', () => {
  let service: OrganizationMembersService;
  let mockMemberModel: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    aggregate: jest.Mock;
  };
  let mockUsersService: {
    addOrganization: jest.Mock;
    removeOrganization: jest.Mock;
  };

  beforeEach(async () => {
    mockMemberModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      aggregate: jest.fn(),
    };

    mockUsersService = {
      addOrganization: jest.fn().mockResolvedValue(null),
      removeOrganization: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationMembersService,
        {
          provide: getModelToken(OrganizationMember.name),
          useValue: mockMemberModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<OrganizationMembersService>(OrganizationMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find members by organizationId using aggregation pipeline', async () => {
    const mockDetailList = [
      {
        _id: 'mem_1',
        userId: 'user_1',
        organizationId: 'org_123',
        role: 'org:admin',
        permissions: ['quizzes:create'],
        status: 'active',
        fullName: 'Admin User',
        email: 'admin@school.edu.vn',
        avatarUrl: null,
        joinedAt: new Date(),
      },
    ];

    mockMemberModel.aggregate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockDetailList),
    });

    const result = await service.findMembersByOrgId('org_123');
    expect(result).toEqual(mockDetailList);
    expect(mockMemberModel.aggregate).toHaveBeenCalled();
  });

  it('should find active member by organizationId and userId', async () => {
    const mockMember = {
      organizationId: 'org_123',
      userId: 'user_123',
      role: 'org:admin',
      status: 'active',
    };

    mockMemberModel.findOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockMember),
    });

    const result = await service.findByOrgAndUser('org_123', 'user_123');
    expect(result).toEqual(mockMember);
    expect(mockMemberModel.findOne).toHaveBeenCalledWith({
      organizationId: 'org_123',
      userId: 'user_123',
      status: 'active',
    });
  });

  it('should handle organizationMembership.created with resolved permissions', async () => {
    mockMemberModel.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce({ organizationId: 'org_123', userId: 'user_123' }),
    });

    await service.handleWebhookEvent({
      type: 'organizationMembership.created',
      data: {
        id: 'mem_123',
        organization: { id: 'org_123', name: 'Acme', slug: 'acme' },
        public_user_data: { user_id: 'user_123' },
        role: 'org:admin',
      },
    });

    expect(mockMemberModel.findOneAndUpdate).toHaveBeenCalledWith(
      { organizationId: 'org_123', userId: 'user_123' },
      {
        $set: {
          role: 'org:admin',
          permissions: expect.arrayContaining([
            PERMISSIONS.QUIZ_MANAGE,
            PERMISSIONS.ROOM_HOST,
            PERMISSIONS.MEMBER_MANAGE,
          ]),
          status: 'active',
        },
        $setOnInsert: {
          organizationId: 'org_123',
          userId: 'user_123',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    expect(mockUsersService.addOrganization).toHaveBeenCalledWith('user_123', 'org_123');
  });

  it('should handle organizationMembership.updated without changing joinedAt or status', async () => {
    mockMemberModel.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce({ organizationId: 'org_123', userId: 'user_123' }),
    });

    await service.handleWebhookEvent({
      type: 'organizationMembership.updated',
      data: {
        id: 'mem_123',
        organization: { id: 'org_123', name: 'Acme', slug: 'acme' },
        public_user_data: { user_id: 'user_123' },
        role: 'org:teacher',
      },
    });

    expect(mockMemberModel.findOneAndUpdate).toHaveBeenCalledWith(
      { organizationId: 'org_123', userId: 'user_123' },
      {
        $set: {
          role: 'org:teacher',
          permissions: expect.arrayContaining([
            PERMISSIONS.QUIZ_MANAGE,
            PERMISSIONS.ROOM_HOST,
            PERMISSIONS.ANALYTICS_VIEW,
          ]),
        },
      },
      { returnDocument: 'after' },
    );
  });

  it('should handle organizationMembership.deleted by setting status to removed', async () => {
    mockMemberModel.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce({ organizationId: 'org_123', userId: 'user_123' }),
    });

    await service.handleWebhookEvent({
      type: 'organizationMembership.deleted',
      data: {
        id: 'mem_123',
        organization: { id: 'org_123', name: 'Acme', slug: 'acme' },
        public_user_data: { user_id: 'user_123' },
        role: 'org:member',
      },
    });

    expect(mockMemberModel.findOneAndUpdate).toHaveBeenCalledWith(
      { organizationId: 'org_123', userId: 'user_123' },
      {
        $set: {
          status: 'removed',
        },
      },
      { returnDocument: 'after' },
    );
    expect(mockUsersService.removeOrganization).toHaveBeenCalledWith('user_123', 'org_123');
  });
});
