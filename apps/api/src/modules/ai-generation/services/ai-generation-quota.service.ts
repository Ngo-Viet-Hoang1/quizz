import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from '../../organizations/schemas/organization.schema';
import { AiGenerationJob, AiGenerationJobDocument } from '../schemas';

@Injectable()
export class AiGenerationQuotaService {
  private readonly logger = new Logger(AiGenerationQuotaService.name);

  constructor(
    @InjectModel(AiGenerationJob.name)
    private readonly jobModel: Model<AiGenerationJobDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async refundQuota(orgId: string, jobId: string): Promise<boolean> {
    // Atomically set quotaRefunded = true only if it is not already true
    const updatedJob = await this.jobModel.findOneAndUpdate(
      {
        _id: jobId,
        organizationId: orgId,
        quotaRefunded: { $ne: true },
      },
      {
        $set: { quotaRefunded: true },
      },
      { new: true },
    );

    if (!updatedJob) {
      this.logger.warn(`Quota refund skipped for job ${jobId} (already refunded or not found)`);
      return false;
    }

    // Safely refund 1 quota unit back to the organization
    await this.organizationModel.updateOne({ _id: orgId }, { $inc: { aiQuotaUsed: -1 } });

    this.logger.log(
      `Successfully refunded 1 AI quota unit for organization ${orgId}, job ${jobId}`,
    );
    return true;
  }
}
