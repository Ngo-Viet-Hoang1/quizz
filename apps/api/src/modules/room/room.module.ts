import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizModule } from '../quiz/quiz.module';
import { UsersModule } from '../users/users.module';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomAttempt, RoomAttemptSchema } from './schemas/room-attempt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: RoomAttempt.name, schema: RoomAttemptSchema },
    ]),
    QuizModule,
    UsersModule,
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
