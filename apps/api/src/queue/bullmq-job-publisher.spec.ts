import { Queue } from 'bullmq';
import { BullMqJobPublisher } from './bullmq-job-publisher';
import { JOB_NAMES } from './queue.constants';

describe('BullMqJobPublisher', () => {
  let publisher: BullMqJobPublisher;
  let aiQueue: jest.Mocked<Queue>;
  let examQueue: jest.Mocked<Queue>;
  let notiQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    aiQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    } as unknown as jest.Mocked<Queue>;
    examQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-2' }),
    } as unknown as jest.Mocked<Queue>;
    notiQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-3' }),
    } as unknown as jest.Mocked<Queue>;

    publisher = new BullMqJobPublisher(aiQueue, examQueue, notiQueue);
  });

  it('should publish to AI_GENERATION queue when job is GENERATE_QUIZ', async () => {
    const data = { topic: 'TypeScript' };
    await publisher.publish(JOB_NAMES.GENERATE_QUIZ, data, { jobId: 'idemp-1' });

    expect(aiQueue.add).toHaveBeenCalledWith(JOB_NAMES.GENERATE_QUIZ, data, { jobId: 'idemp-1' });
    expect(examQueue.add).not.toHaveBeenCalled();
  });

  it('should throw error when job name is unknown', async () => {
    await expect(publisher.publish('unknown-job', {})).rejects.toThrow('Unknown job name');
  });
});
