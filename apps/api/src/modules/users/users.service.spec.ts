import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { ClerkUserData } from '../webhooks/clerk/clerk-webhook.types';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user by id and active status', async () => {
    const mockUser = { _id: 'user_123', status: 'active' };
    mockUserModel.findOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockUser),
    });

    const result = await service.findById('user_123');
    expect(result).toEqual(mockUser);
    expect(mockUserModel.findOne).toHaveBeenCalledWith({
      _id: 'user_123',
      status: 'active',
    });
  });

  it('should sync user from Clerk via syncFromClerk', async () => {
    const mockSyncedUser = {
      _id: 'user_123',
      email: 'test@example.com',
      fullName: 'Test User',
      avatarUrl: 'https://img.clerk.com/avatar.png',
      status: 'active',
    };

    mockUserModel.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockSyncedUser),
    });

    const result = await service.syncFromClerk({
      userId: 'user_123',
      email: 'test@example.com',
      fullName: 'Test User',
      avatarUrl: 'https://img.clerk.com/avatar.png',
    });

    expect(result).toEqual(mockSyncedUser);
    expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user_123' },
      {
        $set: {
          email: 'test@example.com',
          fullName: 'Test User',
          avatarUrl: 'https://img.clerk.com/avatar.png',
          status: 'active',
          deletedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  });

  it('should add organizationId to user via addOrganization', async () => {
    const mockUpdatedUser = {
      _id: 'user_123',
      organizationIds: ['org_123'],
    };

    mockUserModel.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedUser),
    });

    const result = await service.addOrganization('user_123', 'org_123');
    expect(result).toEqual(mockUpdatedUser);
    expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user_123' },
      { $addToSet: { organizationIds: 'org_123' } },
      { returnDocument: 'after' },
    );
  });

  it('should remove organizationId from user via removeOrganization', async () => {
    const mockUpdatedUser = {
      _id: 'user_123',
      organizationIds: [],
    };

    mockUserModel.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedUser),
    });

    const result = await service.removeOrganization('user_123', 'org_123');
    expect(result).toEqual(mockUpdatedUser);
    expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user_123' },
      { $pull: { organizationIds: 'org_123' } },
      { returnDocument: 'after' },
    );
  });

  it('should handle user.created webhook event', async () => {
    mockUserModel.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce({ _id: 'user_123' }),
    });

    const createdUserData: ClerkUserData = {
      id: 'user_123',
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
      image_url: 'https://img.clerk.com/john.png',
      primary_email_address_id: 'email_1',
      email_addresses: [{ id: 'email_1', email_address: 'john@example.com' }],
    };

    await service.handleWebhookEvent({
      type: 'user.created',
      data: createdUserData,
    });

    expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user_123' },
      {
        $set: {
          email: 'john@example.com',
          fullName: 'John Doe',
          avatarUrl: 'https://img.clerk.com/john.png',
          status: 'active',
          deletedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  });

  it('should handle user.updated webhook event', async () => {
    mockUserModel.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce({ _id: 'user_123' }),
    });

    const updatedUserData: ClerkUserData = {
      id: 'user_123',
      first_name: 'John',
      last_name: 'Smith',
      username: 'johnsmith',
      image_url: 'https://img.clerk.com/john_new.png',
      primary_email_address_id: 'email_1',
      email_addresses: [{ id: 'email_1', email_address: 'johnsmith@example.com' }],
    };

    await service.handleWebhookEvent({
      type: 'user.updated',
      data: updatedUserData,
    });

    expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user_123' },
      {
        $set: {
          email: 'johnsmith@example.com',
          fullName: 'John Smith',
          avatarUrl: 'https://img.clerk.com/john_new.png',
        },
      },
    );
  });

  it('should handle user.deleted by setting status to deleted', async () => {
    mockUserModel.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce({ _id: 'user_123' }),
    });

    await service.handleWebhookEvent({
      type: 'user.deleted',
      data: { id: 'user_123', deleted: true },
    });

    expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user_123' },
      {
        $set: {
          email: null,
          fullName: 'Deleted User',
          avatarUrl: null,
          status: 'deleted',
          deletedAt: expect.any(Date),
        },
      },
    );
  });
});
