import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClassesService } from './classes.service';
import { AddClassMemberDto } from './dto';
import { ClassMemberRole, ClassMemberStatus, ClassStatus } from './enums/class.enum';
import { ClassMember, ClassMemberDocument } from './schemas/class-member.schema';

@Injectable()
export class ClassMembersService {
  constructor(
    @InjectModel(ClassMember.name)
    private readonly classMemberModel: Model<ClassMemberDocument>,
    private readonly classesService: ClassesService,
  ) {}

  async addMember(
    classId: string,
    orgId: string,
    ownerId: string,
    dto: AddClassMemberDto,
  ): Promise<ClassMember> {
    const classDoc = await this.classesService.findOne(classId, orgId);

    if (classDoc.ownerId !== ownerId) {
      throw new ForbiddenException('Only class owner can add members');
    }
    if (classDoc.status === ClassStatus.ARCHIVED) {
      throw new BadRequestException('Cannot add members to an archived class');
    }
    if (dto.userId === ownerId) {
      throw new BadRequestException('Class owner is already the manager of the class');
    }

    const existing = await this.classMemberModel
      .findOne({ classId: classDoc._id, userId: dto.userId, organizationId: orgId })
      .exec();

    if (existing) {
      if (existing.status === ClassMemberStatus.ACTIVE) {
        return existing;
      }
      existing.status = ClassMemberStatus.ACTIVE;
      existing.role = dto.role ?? existing.role ?? ClassMemberRole.STUDENT;
      existing.joinedAt = new Date();
      return existing.save();
    }

    return new this.classMemberModel({
      organizationId: orgId,
      classId: classDoc._id,
      userId: dto.userId,
      role: dto.role ?? ClassMemberRole.STUDENT,
      status: ClassMemberStatus.ACTIVE,
      joinedAt: new Date(),
    }).save();
  }

  async join(classId: string, orgId: string, userId: string): Promise<ClassMember> {
    const classDoc = await this.classesService.findOne(classId, orgId);

    if (classDoc.status === ClassStatus.ARCHIVED) {
      throw new BadRequestException('Cannot join an archived class');
    }
    if (classDoc.ownerId === userId) {
      throw new BadRequestException('Class owner is already the manager of the class');
    }

    const existing = await this.classMemberModel
      .findOne({ classId: classDoc._id, userId, organizationId: orgId })
      .exec();

    if (existing) {
      if (existing.status === ClassMemberStatus.ACTIVE) {
        return existing;
      }
      existing.status = ClassMemberStatus.ACTIVE;
      existing.joinedAt = new Date();
      return existing.save();
    }

    return new this.classMemberModel({
      organizationId: orgId,
      classId: classDoc._id,
      userId,
      role: ClassMemberRole.STUDENT,
      status: ClassMemberStatus.ACTIVE,
      joinedAt: new Date(),
    }).save();
  }
}
