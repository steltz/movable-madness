import type { ApiResponse } from '@workspace/shared-types';
import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

admin.initializeApp();

export const helloWorld = onRequest((_req, res) => {
  const response: ApiResponse<string> = {
    success: true,
    data: 'Hello from Firebase Functions!',
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});
