import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { OrganizationsService } from './organizations.service';
import { OrganizationDocument } from './schemas/organization.schema';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @UseGuards(ClerkAuthGuard, OrgContextGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get current active organization profile' })
  @ApiResponse({ status: 200, description: 'Current active organization profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Organization context required' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getMyOrg(@CurrentOrg() orgId: string): Promise<OrganizationDocument> {
    const org = await this.organizationsService.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization not found: ${orgId}`);
    }
    return org;
  }
}
