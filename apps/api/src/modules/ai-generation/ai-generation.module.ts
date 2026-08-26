import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiGenerationJob, AiGenerationJobSchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiGenerationJob.name, schema: AiGenerationJobSchema }]),
  ],
  exports: [MongooseModule],
})
export class AiGenerationModule {}
