import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RoomService } from '../services/room.service';

@Injectable()
export class RoomScheduler {
  private readonly logger = new Logger(RoomScheduler.name);

  constructor(private readonly roomService: RoomService) {}

  @Cron('*/2 * * * *')
  async handleExpiredRoomsSweep(): Promise<void> {
    try {
      const count = await this.roomService.sweepExpiredRooms();
      if (count > 0) {
        this.logger.log(`Swept and finalized ${count} expired zombie live room(s).`);
      }
    } catch (err) {
      this.logger.error('Failed to sweep expired rooms:', err);
    }
  }
}
