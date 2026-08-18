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

  it('should find user by clerkUserId and active status', async () => {
    const mockUser = { clerkUserId: 'user_123', status: 'active' };
    mockUserModel.findOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockUser),
    });

    const result = await service.findByClerkUserId('user_123');
    expect(result).toEqual(mockUser);
    expect(mockUserModel.findOne).toHaveBeenCalledWith({
      clerkUserId: 'user_123',
      status: 'active',
    });
  });
});
