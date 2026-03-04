import { AsyncLocalStorage } from 'node:async_hooks';
import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { type CorrelationContext, generateCorrelationId, isValidCorrelationId } from '../shared';

/**
 * AsyncLocalStorage instance for request-scoped correlation context
 */
const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Get the current correlation context from AsyncLocalStorage
 */
export function getCorrelationContext(): CorrelationContext | undefined {
  return correlationStorage.getStore();
}

/**
 * Run a function with a specific correlation context
 */
export function runWithCorrelation<T>(context: CorrelationContext, fn: () => T): T {
  return correlationStorage.run(context, fn);
}

/**
 * Update the current correlation context
 */
export function updateCorrelationContext(updates: Partial<CorrelationContext>): void {
  const current = getCorrelationContext();
  if (current) {
    Object.assign(current, updates);
  }
}

/**
 * Extract trace context from GCP trace header
 * Format: X-Cloud-Trace-Context: TRACE_ID/SPAN_ID;o=TRACE_TRUE
 */
function parseGcpTraceHeader(header: string | undefined): { traceId?: string; spanId?: string } {
  if (!header) return {};

  const match = header.match(/^([a-f0-9]+)\/(\d+)/i);
  if (match) {
    return {
      traceId: match[1],
      spanId: match[2],
    };
  }
  return {};
}

/**
 * NestJS middleware for request correlation
 * - Generates or validates correlation ID from X-Correlation-ID header
 * - Extracts GCP trace context from X-Cloud-Trace-Context header
 * - Stores context in AsyncLocalStorage for the request lifecycle
 */
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Get or generate correlation ID
    let correlationId = req.headers['x-correlation-id'] as string | undefined;

    if (!correlationId || !isValidCorrelationId(correlationId)) {
      correlationId = generateCorrelationId();
    }

    // Extract GCP trace context
    const traceHeader = req.headers['x-cloud-trace-context'] as string | undefined;
    const { traceId, spanId } = parseGcpTraceHeader(traceHeader);

    // Create correlation context
    const context: CorrelationContext = {
      correlationId,
      traceId,
      spanId,
      startTime: Date.now(),
    };

    // Set response header so clients can track correlation
    res.setHeader('X-Correlation-ID', correlationId);

    // Run the rest of the request with correlation context
    correlationStorage.run(context, () => {
      next();
    });
  }
}
