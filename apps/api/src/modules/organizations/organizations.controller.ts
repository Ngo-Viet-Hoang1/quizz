import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { OrganizationMembersService } from '../organization-members/organization-members.service';
import { OrganizationMemberResponseDto } from './dto/organization-member-response.dto';
import { OrganizationsService } from './organizations.service';
import { OrganizationDocument } from './schemas/organization.schema';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly orgMembersService: OrganizationMembersService,
  ) {}

  @Get('me')
  async getMyOrg(@CurrentOrg() orgId: string): Promise<OrganizationDocument> {
    const org = await this.organizationsService.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization not found: ${orgId}`);
    }
    return org;
  }

  @Get('me/members')
  @ApiOkResponse({ type: [OrganizationMemberResponseDto] })
  async getMyOrgMembers(@CurrentOrg() orgId: string): Promise<OrganizationMemberResponseDto[]> {
    return this.orgMembersService.findMembersByOrgId(orgId);
  }
}
