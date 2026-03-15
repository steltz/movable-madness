import { Injectable } from '@nestjs/common';
import type { ApiResponse, HealthCheckResponse } from '@workspace/shared-types';

@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  getData(): ApiResponse<string> {
    return {
      success: true,
      data: 'Hello from NestJS!',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth(): ApiResponse<HealthCheckResponse> {
    return {
      success: true,
      data: {
        status: 'healthy',
        version: '1.0.0',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
