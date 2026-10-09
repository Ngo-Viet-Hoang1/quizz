import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from '../services/room.service';
import { RoomScheduler } from './room.scheduler';

describe('RoomScheduler', () => {
  let scheduler: RoomScheduler;
  let roomService: jest.Mocked<RoomService>;

  beforeEach(async () => {
    const mockRoomService = {
      sweepExpiredRooms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomScheduler, { provide: RoomService, useValue: mockRoomService }],
    }).compile();

    scheduler = module.get<RoomScheduler>(RoomScheduler);
    roomService = module.get(RoomService);
  });

  describe('handleExpiredRoomsSweep', () => {
    it('should invoke roomService.sweepExpiredRooms', async () => {
      roomService.sweepExpiredRooms.mockResolvedValue(2);

      await scheduler.handleExpiredRoomsSweep();

      expect(roomService.sweepExpiredRooms).toHaveBeenCalled();
    });

    it('should handle and catch errors gracefully without throwing', async () => {
      roomService.sweepExpiredRooms.mockRejectedValue(new Error('Redis connection lost'));

      await expect(scheduler.handleExpiredRoomsSweep()).resolves.not.toThrow();
    });
  });
});
