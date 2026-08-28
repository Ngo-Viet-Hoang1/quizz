import { AiGenerationWorkerService } from './ai-generation-worker.service';

describe('AiGenerationWorkerService', () => {
  let service: AiGenerationWorkerService;

  beforeEach(() => {
    service = new AiGenerationWorkerService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
