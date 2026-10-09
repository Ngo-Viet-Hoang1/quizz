import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
import { QuizVersion, QuizVersionSchema } from '../quiz/schemas/quiz-version.schema';
import { QuizVersionService } from '../quiz/quiz-version.service';
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
      { name: Quiz.name, schema: QuizSchema },
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomGameplayService, RoomGateway, RoomScheduler, QuizVersionService],
  exports: [RoomService, RoomGameplayService],
})
export class RoomModule {}
