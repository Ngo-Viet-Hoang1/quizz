import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

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
