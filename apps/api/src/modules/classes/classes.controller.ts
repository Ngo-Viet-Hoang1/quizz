import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { ApiResponse } from '../../common/response/api-response';
import { ClassMembersService } from './class-members.service';
import { ClassesService } from './classes.service';
import {
  AddClassMemberDto,
  AssignQuizDto,
  CreateClassDto,
  QueryClassMemberDto,
  QueryClassDto,
  QueryQuizAssignmentDto,
  UpdateClassDto,
} from './dto';
import { IClass, IClassMember, IQuizAssignment } from './interfaces/class.interface';
import { Class } from './schemas/class.schema';
import { ClassMember } from './schemas/class-member.schema';
import { QuizAssignment } from './schemas/quiz-assignment.schema';

@ApiTags('classes')
@Controller('classes')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly classMembersService: ClassMembersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Audit('class.create')
  @ApiOperation({ summary: 'Create a new class' })
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateClassDto,
  ): Promise<Class> {
    return this.classesService.create(orgId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classes for current organization with pagination' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryClassDto,
  ): Promise<ApiResponse<IClass[]>> {
    const { items, meta } = await this.classesService.findAll(orgId, query);
    return ApiResponse.success(items, meta);
  }

  @Get('owned')
  @ApiOperation({ summary: 'Get classes owned/managed by current teacher with pagination' })
  async findOwned(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Query() query: QueryClassDto,
  ): Promise<ApiResponse<IClass[]>> {
    const { items, meta } = await this.classesService.findOwnedClasses(orgId, userId, query);
    return ApiResponse.success(items, meta);
  }

  @Get('enrolled')
  @ApiOperation({ summary: 'Get classes current user is enrolled in as member' })
  async findEnrolled(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Query() query: QueryClassDto,
  ): Promise<ApiResponse<IClass[]>> {
    const { items, meta } = await this.classMembersService.findEnrolledClasses(
      orgId,
      userId,
      query,
    );
    return ApiResponse.success(items, meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by ID' })
  findOne(@CurrentOrg() orgId: string, @Param('id', ParseObjectIdPipe) id: string): Promise<Class> {
    return this.classesService.findOne(id, orgId);
  }

  @Patch(':id')
  @Audit('class.update')
  @ApiOperation({ summary: 'Update class details' })
  update(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateClassDto,
  ): Promise<Class> {
    return this.classesService.update(id, orgId, userId, dto);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @Audit('class.archive')
  @ApiOperation({ summary: 'Archive a class' })
  archive(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<Class> {
    return this.classesService.archive(id, orgId, userId);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @Audit('class.member.add')
  @ApiOperation({ summary: 'Add a student or assistant to class by teacher' })
  addMember(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AddClassMemberDto,
  ): Promise<ClassMember> {
    return this.classMembersService.addMember(id, orgId, userId, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get members of a class with pagination' })
  async getMembers(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: QueryClassMemberDto,
  ): Promise<ApiResponse<IClassMember[]>> {
    const { items, meta } = await this.classMembersService.getMembers(id, orgId, query);
    return ApiResponse.success(items, meta);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @Audit('class.join')
  @ApiOperation({ summary: 'Join a class by student' })
  join(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<ClassMember> {
    return this.classMembersService.join(id, orgId, userId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @Audit('class.leave')
  @ApiOperation({ summary: 'Leave a class by student' })
  leave(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<ClassMember> {
    return this.classMembersService.removeMember(id, orgId, userId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @Audit('class.member.remove')
  @ApiOperation({ summary: 'Remove a member from class by teacher' })
  removeMember(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') actorId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId') targetUserId: string,
  ): Promise<ClassMember> {
    return this.classMembersService.removeMember(id, orgId, actorId, targetUserId);
  }

  @Post(':id/assignments')
  @HttpCode(HttpStatus.CREATED)
  @Audit('class.quiz.assign')
  @ApiOperation({ summary: 'Assign a quiz to class by teacher' })
  assignQuiz(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AssignQuizDto,
  ): Promise<QuizAssignment> {
    return this.classesService.assignQuiz(id, orgId, userId, dto);
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Get assigned quizzes for a class with pagination' })
  async getClassAssignments(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: QueryQuizAssignmentDto,
  ): Promise<ApiResponse<IQuizAssignment[]>> {
    const { items, meta } = await this.classesService.getClassAssignments(id, orgId, query);
    return ApiResponse.success(items, meta);
  }

  @Delete(':id/assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @Audit('class.quiz.unassign')
  @ApiOperation({ summary: 'Remove a quiz assignment from class by teacher' })
  removeAssignment(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('assignmentId', ParseObjectIdPipe) assignmentId: string,
  ): Promise<{ success: boolean }> {
    return this.classesService.removeAssignment(id, assignmentId, orgId, userId);
  }
}
