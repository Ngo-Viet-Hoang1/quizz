import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
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
  exports: [MongooseModule],
})
export class ClassesModule {}
