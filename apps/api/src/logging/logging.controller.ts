import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StructuredLogger } from '@workspace/logging/backend';
import { FrontendErrorReportDto } from './dto/frontend-error-report.dto';

@ApiTags('Logging')
@Controller('api/v1/logs')
export class LoggingController {
  constructor(private readonly logger: StructuredLogger) {}

  @Post('errors')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Report frontend error',
    description: 'Receives error reports from the frontend for centralized logging',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Error logged successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid error report payload',
  })
  reportError(@Body() report: FrontendErrorReportDto): void {
    const error = report.error
      ? Object.assign(new Error(report.error.message), {
          name: report.error.name,
          stack: report.error.stack,
        })
      : undefined;

    this.logger.logWithContext(
      report.severity,
      `[Frontend] ${report.message}`,
      {
        service: report.service,
        environment: report.environment,
        breadcrumbs: report.breadcrumbs,
        frontendCorrelationId: report.correlationId,
        frontendUserId: report.userId,
        frontendTimestamp: report.timestamp,
      },
      error,
    );
  }
}
