import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { paginate, PaginateResult } from '../../common/utils/paginate.util';
import { ClassesService } from './classes.service';
import { AddClassMemberDto, QueryClassDto, QueryClassMemberDto } from './dto';
import { ClassMemberRole, ClassMemberStatus, ClassStatus } from './enums/class.enum';
import { IClass, IClassMember } from './interfaces/class.interface';
import { Class, ClassDocument } from './schemas/class.schema';
import { ClassMember, ClassMemberDocument } from './schemas/class-member.schema';

const MEMBER_SORT_FIELDS = ['joinedAt', 'role', 'status'] as const;
const CLASS_SORT_FIELDS = ['createdAt', 'name', 'status'] as const;

@Injectable()
export class ClassMembersService {
  constructor(
    @InjectModel(ClassMember.name)
    private readonly classMemberModel: Model<ClassMemberDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
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
      if (
        existing.status === ClassMemberStatus.ACTIVE ||
        existing.status === ClassMemberStatus.PENDING
      ) {
        return existing;
      }
      existing.status = ClassMemberStatus.PENDING;
      existing.joinedAt = new Date();
      return existing.save();
    }

    return new this.classMemberModel({
      organizationId: orgId,
      classId: classDoc._id,
      userId,
      role: ClassMemberRole.STUDENT,
      status: ClassMemberStatus.PENDING,
      joinedAt: new Date(),
    }).save();
  }

  async removeMember(
    classId: string,
    orgId: string,
    actorId: string,
    targetUserId?: string,
  ): Promise<ClassMember> {
    const classDoc = await this.classesService.findOne(classId, orgId);
    const userIdToRemove = targetUserId ?? actorId;

    if (userIdToRemove === classDoc.ownerId) {
      throw new BadRequestException('Class owner cannot be removed from class');
    }

    if (userIdToRemove !== actorId && classDoc.ownerId !== actorId) {
      throw new ForbiddenException('Only class owner can remove other members');
    }

    const member = await this.classMemberModel
      .findOne({ classId: classDoc._id, userId: userIdToRemove, organizationId: orgId })
      .exec();

    if (!member) throw new NotFoundException('Member not found in this class');
    if (member.status === ClassMemberStatus.REMOVED) return member;

    member.status = ClassMemberStatus.REMOVED;
    return member.save();
  }

  async getMembers(
    classId: string,
    orgId: string,
    query: QueryClassMemberDto,
  ): Promise<PaginateResult<IClassMember>> {
    const classDoc = await this.classesService.findOne(classId, orgId);

    const filter: QueryFilter<ClassMemberDocument> = {
      organizationId: orgId,
      classId: classDoc._id,
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
    };

    return paginate<IClassMember, ClassMemberDocument>(this.classMemberModel, filter, query, {
      allowedSortFields: MEMBER_SORT_FIELDS,
    });
  }

  async findEnrolledClasses(
    orgId: string,
    userId: string,
    query: QueryClassDto,
  ): Promise<PaginateResult<IClass>> {
    const activeMemberships = await this.classMemberModel
      .find({ organizationId: orgId, userId, status: ClassMemberStatus.ACTIVE })
      .select('classId')
      .lean()
      .exec();

    const classIds = activeMemberships.map((m) => m.classId);

    const filter: QueryFilter<ClassDocument> = {
      _id: { $in: classIds },
      organizationId: orgId,
      ...(query.status && { status: query.status }),
    };

    if (query.search) {
      const trimmed = query.search.trim();
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    return paginate<IClass, ClassDocument>(this.classModel, filter, query, {
      allowedSortFields: CLASS_SORT_FIELDS,
    });
  }

  async approveMember(
    classId: string,
    orgId: string,
    actorId: string,
    targetUserId: string,
  ): Promise<ClassMember> {
    const classDoc = await this.classesService.findOne(classId, orgId);

    if (classDoc.ownerId !== actorId) {
      throw new ForbiddenException('Only class owner can approve members');
    }
    if (classDoc.status === ClassStatus.ARCHIVED) {
      throw new BadRequestException('Cannot approve members in an archived class');
    }

    const member = await this.classMemberModel
      .findOne({ classId: classDoc._id, userId: targetUserId, organizationId: orgId })
      .exec();

    if (!member) throw new NotFoundException('Member request not found in this class');
    if (member.status === ClassMemberStatus.ACTIVE) return member;

    member.status = ClassMemberStatus.ACTIVE;
    member.joinedAt = new Date();
    return member.save();
  }

  async rejectMember(
    classId: string,
    orgId: string,
    actorId: string,
    targetUserId: string,
  ): Promise<ClassMember> {
    const classDoc = await this.classesService.findOne(classId, orgId);

    if (classDoc.ownerId !== actorId) {
      throw new ForbiddenException('Only class owner can reject member requests');
    }

    const member = await this.classMemberModel
      .findOne({ classId: classDoc._id, userId: targetUserId, organizationId: orgId })
      .exec();

    if (!member) throw new NotFoundException('Member request not found in this class');
    if (member.status === ClassMemberStatus.REMOVED) return member;

    member.status = ClassMemberStatus.REMOVED;
    return member.save();
  }
}
