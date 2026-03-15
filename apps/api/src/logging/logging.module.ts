import {
  type DynamicModule,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  CorrelationMiddleware,
  RequestLoggingInterceptor,
  StructuredLogger,
} from '@workspace/logging/backend';
import type { LoggingModuleOptions } from '@workspace/logging/shared';
import { LoggingController } from './logging.controller';

@Module({})
export class LoggingModule implements NestModule {
  static forRoot(options: LoggingModuleOptions): DynamicModule {
    const loggerProvider = {
      provide: StructuredLogger,
      useFactory: () => {
        return new StructuredLogger({
          service: options.service,
          level: options.level,
          format: options.format,
          redaction: options.redaction,
        });
      },
    };

    const interceptorProvider =
      options.enableRequestLogging !== false
        ? {
            provide: APP_INTERCEPTOR,
            useFactory: (logger: StructuredLogger) => {
              return new RequestLoggingInterceptor(logger);
            },
            inject: [StructuredLogger],
          }
        : null;

    const providers = [loggerProvider, ...(interceptorProvider ? [interceptorProvider] : [])];

    return {
      module: LoggingModule,
      global: true,
      providers,
      exports: [StructuredLogger],
      controllers: [LoggingController],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
