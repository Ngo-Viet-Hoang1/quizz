import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
import { ClassMembersService } from './class-members.service';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { Class, ClassSchema } from './schemas/class.schema';
import { ClassMember, ClassMemberSchema } from './schemas/class-member.schema';
import { QuizAssignment, QuizAssignmentSchema } from './schemas/quiz-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Class.name, schema: ClassSchema },
      { name: ClassMember.name, schema: ClassMemberSchema },
      { name: QuizAssignment.name, schema: QuizAssignmentSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
  ],
  controllers: [ClassesController],
  providers: [ClassesService, ClassMembersService],
  exports: [ClassesService, ClassMembersService, MongooseModule],
})
export class ClassesModule {}
