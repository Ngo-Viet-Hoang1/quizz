import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { Organization } from './schemas/organization.schema';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let mockOrganizationModel: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    mockOrganizationModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getModelToken(Organization.name),
          useValue: mockOrganizationModel,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should find active organization by id', async () => {
    const mockOrg = {
      _id: 'org_123',
      name: 'Acme School',
      status: 'active',
    };

    mockOrganizationModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockOrg),
    });

    const result = await service.findById('org_123');
    expect(result).toEqual(mockOrg);
    expect(mockOrganizationModel.findOne).toHaveBeenCalledWith({
      _id: 'org_123',
      status: 'active',
    });
  });

  it('should handle organization.created by upserting active org', async () => {
    const createdEvent = {
      type: 'organization.created' as const,
      data: {
        id: 'org_123',
        name: 'Acme School',
        slug: 'acme-school',
        image_url: 'https://img.clerk.com/org.png',
        created_at: 1710000000,
      },
    };

    mockOrganizationModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce({ _id: 'org_123' }),
    });

    await service.handleWebhookEvent(createdEvent);

    expect(mockOrganizationModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'org_123' },
      {
        $set: {
          name: 'Acme School',
          slug: 'acme-school',
          logoUrl: 'https://img.clerk.com/org.png',
          status: 'active',
          deletedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  });

  it('should handle organization.updated without altering status or deletedAt', async () => {
    const updatedEvent = {
      type: 'organization.updated' as const,
      data: {
        id: 'org_123',
        name: 'Acme New Name',
        slug: 'acme-new-name',
        image_url: 'https://img.clerk.com/new.png',
        created_at: 1710000000,
      },
    };

    mockOrganizationModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce({ _id: 'org_123' }),
    });

    await service.handleWebhookEvent(updatedEvent);

    expect(mockOrganizationModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'org_123' },
      {
        $set: {
          name: 'Acme New Name',
          slug: 'acme-new-name',
          logoUrl: 'https://img.clerk.com/new.png',
        },
      },
    );
  });

  it('should handle organization.deleted by setting status to deleted and setting deletedAt', async () => {
    const deletedEvent = {
      type: 'organization.deleted' as const,
      data: {
        id: 'org_123',
        deleted: true,
      },
    };

    mockOrganizationModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce({ _id: 'org_123' }),
    });

    await service.handleWebhookEvent(deletedEvent);

    expect(mockOrganizationModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'org_123' },
      {
        $set: {
          status: 'deleted',
          deletedAt: expect.any(Date),
        },
      },
    );
  });
});
