import { Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { OrganizationMembersService } from '../organization-members/organization-members.service';
import { OrganizationMemberResponseDto } from './dto/organization-member-response.dto';
import { OrganizationsService } from './organizations.service';
import { OrganizationDocument } from './schemas/organization.schema';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly orgMembersService: OrganizationMembersService,
  ) {}

  @Get('public')
  @ApiOperation({ summary: 'Get list of active public organizations for student exploration' })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getPublicOrganizations(@Query('search') search?: string): Promise<OrganizationDocument[]> {
    return this.organizationsService.findPublicOrganizations(search);
  }

  @Post(':id/join')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Join an organization as a student (member role)' })
  async joinOrganization(
    @Param('id') orgId: string,
    @CurrentUser('_id') userId: string,
  ): Promise<{ success: boolean; organization: OrganizationDocument }> {
    return this.organizationsService.joinOrganizationAsStudent(orgId, userId);
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard, OrgContextGuard)
  @ApiBearerAuth('clerk-auth')
  async getMyOrg(@CurrentOrg() orgId: string): Promise<OrganizationDocument> {
    const org = await this.organizationsService.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization not found: ${orgId}`);
    }
    return org;
  }

  @Get('me/members')
  @UseGuards(ClerkAuthGuard, OrgContextGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOkResponse({ type: [OrganizationMemberResponseDto] })
  async getMyOrgMembers(@CurrentOrg() orgId: string): Promise<OrganizationMemberResponseDto[]> {
    return this.orgMembersService.findMembersByOrgId(orgId);
  }
}
