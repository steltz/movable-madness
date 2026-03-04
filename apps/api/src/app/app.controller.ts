import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ApiResponse as AppApiResponse, HealthCheckResponse } from '@workspace/shared-types';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application data' })
  @ApiResponse({ status: 200, description: 'Returns application data' })
  getData(): AppApiResponse<string> {
    return this.appService.getData();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Returns health status' })
  getHealth(): AppApiResponse<HealthCheckResponse> {
    return this.appService.getHealth();
  }
}
