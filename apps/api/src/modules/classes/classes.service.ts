import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { paginate, PaginateResult } from '../../common/utils/paginate.util';
import { CreateClassDto, QueryClassDto, UpdateClassDto } from './dto';
import { ClassStatus } from './enums/class.enum';
import { IClass } from './interfaces/class.interface';
import { Class, ClassDocument } from './schemas/class.schema';

const CLASS_SORT_FIELDS = ['createdAt', 'name', 'status'] as const;

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

  async findAll(orgId: string, query: QueryClassDto): Promise<PaginateResult<IClass>> {
    return paginate<IClass, ClassDocument>(this.classModel, this.buildFilter(orgId, query), query, {
      allowedSortFields: CLASS_SORT_FIELDS,
    });
  }

  async findOwnedClasses(
    orgId: string,
    ownerId: string,
    query: QueryClassDto,
  ): Promise<PaginateResult<IClass>> {
    const ownedQuery = Object.assign(new QueryClassDto(), query, { ownerId });
    return this.findAll(orgId, ownedQuery);
  }

  async findOne(id: string, orgId: string): Promise<ClassDocument> {
    const classDoc = await this.classModel
      .findOne({ _id: new Types.ObjectId(id), organizationId: orgId })
      .exec();

    if (!classDoc) throw new NotFoundException('Class not found');
    return classDoc;
  }

  async update(id: string, orgId: string, ownerId: string, dto: UpdateClassDto): Promise<Class> {
    const classDoc = await this.findOne(id, orgId);

    if (classDoc.ownerId !== ownerId) {
      throw new ForbiddenException('Only class owner can update class');
    }

    Object.assign(classDoc, {
      ...(dto.name && { name: dto.name.trim() }),
      ...(dto.status && { status: dto.status }),
    });

    return classDoc.save();
  }

  async archive(id: string, orgId: string, ownerId: string): Promise<Class> {
    const classDoc = await this.findOne(id, orgId);

    if (classDoc.ownerId !== ownerId) {
      throw new ForbiddenException('Only class owner can archive class');
    }
    if (classDoc.status === ClassStatus.ARCHIVED) {
      throw new BadRequestException('Class is already archived');
    }

    classDoc.status = ClassStatus.ARCHIVED;
    return classDoc.save();
  }

  private buildFilter(orgId: string, query: QueryClassDto): QueryFilter<ClassDocument> {
    const filter: QueryFilter<ClassDocument> = {
      organizationId: orgId,
      ...(query.status && { status: query.status }),
      ...(query.ownerId && { ownerId: query.ownerId }),
    };

    if (query.search) {
      const trimmed = query.search.trim();
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    return filter;
  }
}
