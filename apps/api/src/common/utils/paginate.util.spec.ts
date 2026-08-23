import { Model } from 'mongoose';
import { paginate } from './paginate.util';

describe('paginate util', () => {
  it('should paginate items with default and allowed sort fields', async () => {
    const mockItems = [{ title: 'Quiz 1' }, { title: 'Quiz 2' }];
    const mockExec = jest.fn().mockResolvedValue(mockItems);
    const mockCountExec = jest.fn().mockResolvedValue(25);

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnValue({ exec: mockExec }),
    };

    const mockModel = {
      find: jest.fn().mockReturnValue(mockQuery),
      countDocuments: jest.fn().mockReturnValue({ exec: mockCountExec }),
    } as unknown as Model<unknown>;

    const result = await paginate(
      mockModel,
      { organizationId: 'org_123' },
      { page: 2, limit: 10, sortBy: 'title', sortOrder: 'asc' },
      {
        allowedSortFields: ['createdAt', 'title'] as const,
        projection: { 'questions.options.isCorrect': 0 },
      },
    );

    expect(mockModel.find).toHaveBeenCalledWith(
      { organizationId: 'org_123' },
      { 'questions.options.isCorrect': 0 },
    );
    expect(mockQuery.sort).toHaveBeenCalledWith({ title: 1 });
    expect(mockQuery.skip).toHaveBeenCalledWith(10);
    expect(mockQuery.limit).toHaveBeenCalledWith(10);
    expect(mockModel.countDocuments).toHaveBeenCalledWith({ organizationId: 'org_123' });
    expect(result).toEqual({
      items: mockItems,
      meta: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });
  });

  it('should fallback to createdAt if sortBy is not in allowedSortFields whitelist', async () => {
    const mockExec = jest.fn().mockResolvedValue([]);
    const mockCountExec = jest.fn().mockResolvedValue(0);

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnValue({ exec: mockExec }),
    };

    const mockModel = {
      find: jest.fn().mockReturnValue(mockQuery),
      countDocuments: jest.fn().mockReturnValue({ exec: mockCountExec }),
    } as unknown as Model<unknown>;

    await paginate(
      mockModel,
      {},
      { page: 1, limit: 10, sortBy: 'maliciousField; DROP TABLE', sortOrder: 'desc' },
      {
        allowedSortFields: ['createdAt', 'title'] as const,
      },
    );

    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });
});
