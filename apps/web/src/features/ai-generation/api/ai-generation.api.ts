import { apiClient, useApiClient, PaginatedResponse } from '@/shared/lib/api-client';
import {
  AiGenerationJobItem,
  AiGenerationQueryParams,
  EnqueueAiGenerationJobInput,
  EnqueueJobResponse,
  GetJobStatusResponse,
} from '../types';

export const aiGenerationKeys = {
  all: ['ai-generation'] as const,
  jobs: () => [...aiGenerationKeys.all, 'jobs'] as const,
  jobList: (params?: AiGenerationQueryParams) =>
    [...aiGenerationKeys.jobs(), params ?? {}] as const,
  status: (id: string) => [...aiGenerationKeys.all, 'status', id] as const,
};

export const createAiGenerationApi = (client = apiClient) => ({
  enqueueJob: (data: EnqueueAiGenerationJobInput) =>
    client.post<EnqueueJobResponse>('/ai-generation-jobs', data),

  getJobStatus: (id: string) => client.get<GetJobStatusResponse>(`/ai-generation-jobs/${id}`),

  getJobs: (params?: AiGenerationQueryParams): Promise<PaginatedResponse<AiGenerationJobItem[]>> =>
    client.getPaginated<AiGenerationJobItem[]>('/ai-generation-jobs', {
      params,
    }),
});

export const aiGenerationApi = createAiGenerationApi();
export const useAiGenerationApi = () => createAiGenerationApi(useApiClient());
