import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationDocument } from './schemas/organization.schema';
import { ClerkClient } from '@clerk/backend';
import { CLERK_CLIENT } from '../../common/clerk/clerk-client.provider';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { OrganizationMembersService } from '../organization-members/organization-members.service';
import { OrganizationMemberDetail } from '../organization-members/types/organization-member-detail.type';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let organizationsService: {
    findById: jest.Mock;
  };
  let orgMembersService: {
    findMembersByOrgId: jest.Mock;
  };

  beforeEach(async () => {
    organizationsService = {
      findById: jest.fn(),
    };

    orgMembersService = {
      findMembersByOrgId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: organizationsService,
        },
        {
          provide: OrganizationMembersService,
          useValue: orgMembersService,
        },
        {
          provide: CLERK_CLIENT,
          useValue: {} as unknown as ClerkClient,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it('should return current organization document when found', async () => {
    const mockOrg = {
      _id: 'org_123',
      name: 'Acme School',
      status: 'active',
    } as unknown as OrganizationDocument;

    organizationsService.findById.mockResolvedValueOnce(mockOrg);

    const result = await controller.getMyOrg('org_123');
    expect(result).toEqual(mockOrg);
    expect(organizationsService.findById).toHaveBeenCalledWith('org_123');
  });

  it('should throw NotFoundException when organization is not found', async () => {
    organizationsService.findById.mockResolvedValueOnce(null);

    await expect(controller.getMyOrg('org_nonexistent')).rejects.toThrow(NotFoundException);
    expect(organizationsService.findById).toHaveBeenCalledWith('org_nonexistent');
  });

  it('should return list of organization members with profiles', async () => {
    const mockMembers: OrganizationMemberDetail[] = [
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

    orgMembersService.findMembersByOrgId.mockResolvedValueOnce(mockMembers);

    const result = await controller.getMyOrgMembers('org_123');
    expect(result).toEqual(mockMembers);
    expect(orgMembersService.findMembersByOrgId).toHaveBeenCalledWith('org_123');
  });
});
