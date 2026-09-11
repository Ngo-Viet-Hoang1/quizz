import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationMembersService } from './organization-members.service';
import { OrganizationMember, OrganizationMemberSchema } from './schemas/organization-member.schema';

import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrganizationMember.name, schema: OrganizationMemberSchema },
    ]),
    UsersModule,
  ],
  providers: [OrganizationMembersService],
  exports: [OrganizationMembersService],
})
export class OrganizationMembersModule {}
