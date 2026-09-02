import { auth } from '@clerk/nextjs/server';
import { createApiClientInstance } from './api-client';

// Used for Server Components & Route Handlers (Runs on Node.js SSR)
export const serverApiClient = createApiClientInstance(async () => {
  const { getToken } = await auth();
  return getToken();
});
