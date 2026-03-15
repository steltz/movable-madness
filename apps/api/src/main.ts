import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { StructuredLogger } from '@workspace/logging/backend';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use structured logger as the application logger
  const logger = app.get(StructuredLogger);
  app.useLogger(logger);

  const port = process.env.PORT || 3000;

  const config = new DocumentBuilder()
    .setTitle('Scaffold API')
    .setDescription('API documentation for the Scaffold application')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://api-staging.example.com', 'Staging')
    .addServer('https://api.example.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: '/api-docs-json',
  });

  await app.listen(port);
  logger.log(`API is running on: http://localhost:${port}`);
  logger.log(`Swagger UI available at: http://localhost:${port}/api-docs`);
}

bootstrap();
