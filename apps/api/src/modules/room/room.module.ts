import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizVersion, QuizVersionSchema } from '../quiz/schemas/quiz-version.schema';
import { RoomController } from './room.controller';
import { RoomGateway } from './room.gateway';
import { RoomResult, RoomResultSchema } from './schemas/room-result.schema';
import { RoomGameplayService, RoomService } from './services';
import { RoomScheduler } from './tasks/room.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomResult.name, schema: RoomResultSchema },
      { name: QuizVersion.name, schema: QuizVersionSchema },
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomGameplayService, RoomGateway, RoomScheduler],
  exports: [RoomService, RoomGameplayService],
})
export class RoomModule {}
