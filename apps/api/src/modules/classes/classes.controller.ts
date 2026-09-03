import {
  Body,
  Controller,
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
import { ClassesService } from './classes.service';
import { CreateClassDto, QueryClassDto, UpdateClassDto } from './dto';
import { IClass } from './interfaces/class.interface';
import { Class } from './schemas/class.schema';

@ApiTags('classes')
@Controller('classes')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

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
}
