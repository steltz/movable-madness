import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Breadcrumb, LogSeverity } from '@workspace/logging/shared';

class ErrorDetailDto {
  @ApiProperty({ description: 'Error name', example: 'TypeError' })
  name!: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Cannot read property "x" of undefined',
  })
  message!: string;

  @ApiPropertyOptional({ description: 'Stack trace' })
  stack?: string;
}

class EnvironmentDto {
  @ApiProperty({
    description: 'User agent string',
    example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  })
  userAgent!: string;

  @ApiProperty({ description: 'Current page URL', example: '/admin/dashboard' })
  url!: string;

  @ApiPropertyOptional({
    description: 'Referrer URL',
    example: '/admin/settings',
  })
  referrer?: string;
}

class BreadcrumbDto {
  @ApiProperty({
    description: 'Breadcrumb type',
    enum: ['click', 'navigation', 'input', 'api_request', 'api_response', 'error', 'custom'],
    example: 'click',
  })
  type!: Breadcrumb['type'];

  @ApiProperty({
    description: 'ISO 8601 timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Human-readable description',
    example: 'Clicked "Submit" button',
  })
  message!: string;

  @ApiPropertyOptional({ description: 'Breadcrumb category', example: 'ui' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Additional data',
    example: { element: 'button', text: 'Submit' },
  })
  data?: Record<string, unknown>;
}

export class FrontendErrorReportDto {
  @ApiProperty({
    description: 'Log severity',
    enum: ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
    example: 'ERROR',
  })
  severity!: LogSeverity;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to load user data',
  })
  message!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({ description: 'Service name', example: 'web' })
  service!: string;

  @ApiPropertyOptional({ description: 'Error details', type: ErrorDetailDto })
  error?: ErrorDetailDto;

  @ApiPropertyOptional({
    description: 'User action breadcrumbs',
    type: [BreadcrumbDto],
  })
  breadcrumbs?: BreadcrumbDto[];

  @ApiProperty({ description: 'Environment information', type: EnvironmentDto })
  environment!: EnvironmentDto;

  @ApiPropertyOptional({
    description: 'Authenticated user ID',
    example: 'user_123',
  })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Correlation ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  correlationId?: string;
}
