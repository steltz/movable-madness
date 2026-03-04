import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BracketUsersController } from './bracket-users.controller';
import { BracketUsersService } from './bracket-users.service';

@Module({
  imports: [AuthModule],
  controllers: [BracketUsersController],
  providers: [BracketUsersService],
})
export class BracketUsersModule {}
