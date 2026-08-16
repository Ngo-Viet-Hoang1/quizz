import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  traceId: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getTraceId(): string | undefined {
  return requestContextStorage.getStore()?.traceId;
}
