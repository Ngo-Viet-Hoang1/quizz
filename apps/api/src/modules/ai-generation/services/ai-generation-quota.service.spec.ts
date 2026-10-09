import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Organization } from '../../organizations/schemas/organization.schema';
import { AiGenerationJob } from '../schemas';
import { AiGenerationQuotaService } from './ai-generation-quota.service';

type MockJobModel = {
  findOneAndUpdate: jest.Mock;
};

type MockOrgModel = {
  updateOne: jest.Mock;
};

describe('AiGenerationQuotaService', () => {
  let service: AiGenerationQuotaService;
  let jobModel: MockJobModel;
  let orgModel: MockOrgModel;

  const orgId = 'org_abc_1';
  const jobId = new Types.ObjectId().toString();

  beforeEach(async () => {
    jobModel = {
      findOneAndUpdate: jest.fn(),
    };

    orgModel = {
      updateOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGenerationQuotaService,
        {
          provide: getModelToken(AiGenerationJob.name),
          useValue: jobModel,
        },
        {
          provide: getModelToken(Organization.name),
          useValue: orgModel,
        },
      ],
    }).compile();

    service = module.get<AiGenerationQuotaService>(AiGenerationQuotaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully refund quota when job has not been refunded yet', async () => {
    jobModel.findOneAndUpdate.mockResolvedValue({
      _id: jobId,
      organizationId: orgId,
      quotaRefunded: true,
    });
    orgModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const refunded = await service.refundQuota(orgId, jobId);

    expect(jobModel.findOneAndUpdate).toHaveBeenCalledWith(
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

    expect(orgModel.updateOne).toHaveBeenCalledWith({ _id: orgId }, { $inc: { aiQuotaUsed: -1 } });

    expect(refunded).toBe(true);
  });

  it('should not refund quota if job was already refunded (double-refund protection)', async () => {
    // findOneAndUpdate returns null because quotaRefunded is already true
    jobModel.findOneAndUpdate.mockResolvedValue(null);

    const refunded = await service.refundQuota(orgId, jobId);

    expect(jobModel.findOneAndUpdate).toHaveBeenCalledWith(
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

    expect(orgModel.updateOne).not.toHaveBeenCalled();
    expect(refunded).toBe(false);
  });
});
