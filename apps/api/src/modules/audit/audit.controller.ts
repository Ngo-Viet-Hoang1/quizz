import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ApiResponse } from '../../common/response/api-response';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditLog } from './schemas/audit-log.schema';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated audit logs for the current organization',
    description:
      'Returns historical audit trails filtered by action, resourceType, date range, or actor.',
  })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryAuditLogsDto,
  ): Promise<ApiResponse<AuditLog[]>> {
    const { items, meta } = await this.auditService.findByOrg(orgId, query);
    return ApiResponse.success(items, meta);
  }
}
