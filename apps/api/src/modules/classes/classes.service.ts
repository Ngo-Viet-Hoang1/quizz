import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateClassDto } from './dto';
import { ClassStatus } from './enums/class.enum';
import { Class, ClassDocument } from './schemas/class.schema';

@Injectable()
export class ClassesService {
  constructor(@InjectModel(Class.name) private readonly classModel: Model<ClassDocument>) {}

  async create(orgId: string, ownerId: string, dto: CreateClassDto): Promise<Class> {
    return new this.classModel({
      organizationId: orgId,
      name: dto.name.trim(),
      ownerId,
      status: ClassStatus.ACTIVE,
    }).save();
  }
}
