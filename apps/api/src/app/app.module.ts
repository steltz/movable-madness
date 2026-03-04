import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BracketUsersModule } from '../bracket-users/bracket-users.module';
import { BracketsModule } from '../brackets/brackets.module';
import { LoggingModule } from '../logging/logging.module';
import { UsersModule } from '../users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    LoggingModule.forRoot({
      service: 'api',
      enableRequestLogging: true,
    }),
    AuthModule,
    BracketUsersModule,
    UsersModule,
    BracketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
