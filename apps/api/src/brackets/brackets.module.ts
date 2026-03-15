import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';

@Module({
  imports: [AuthModule],
  controllers: [BracketsController],
  providers: [BracketsService],
})
export class BracketsModule {}
