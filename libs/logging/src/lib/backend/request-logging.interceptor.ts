import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { type Observable, tap } from 'rxjs';
import type { HttpRequestInfo, LogSeverity } from '../shared';
import { getCorrelationContext } from './correlation.middleware';
import type { StructuredLogger } from './nest-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const correlationContext = getCorrelationContext();
    const startTime = correlationContext?.startTime ?? Date.now();

    // Log incoming request
    const requestInfo: HttpRequestInfo = {
      method: request.method,
      url: request.originalUrl || request.url,
      userAgent: request.headers['user-agent'],
      referer: request.headers.referer as string | undefined,
      remoteIp: this.getClientIp(request),
    };

    this.logger.logWithContext('INFO', 'Incoming request', {
      httpRequest: requestInfo,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const latencyMs = Date.now() - startTime;
          const statusCode = response.statusCode;

          const responseInfo: HttpRequestInfo = {
            ...requestInfo,
            statusCode,
            latencyMs,
          };

          const severity: LogSeverity = statusCode >= 500 ? 'ERROR' : 'INFO';

          this.logger.logWithContext(severity, 'Request completed', {
            httpRequest: responseInfo,
          });
        },
        error: (error) => {
          const latencyMs = Date.now() - startTime;
          const statusCode = error.status || error.statusCode || 500;

          const responseInfo: HttpRequestInfo = {
            ...requestInfo,
            statusCode,
            latencyMs,
          };

          this.logger.logWithContext(
            'ERROR',
            `Request failed: ${error.message}`,
            { httpRequest: responseInfo },
            error instanceof Error ? error : new Error(String(error)),
          );
        },
      }),
    );
  }

  private getClientIp(request: Request): string | undefined {
    // Check various headers for the real client IP
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
      return ips.trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip;
  }
}
