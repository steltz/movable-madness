import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { CaslAbilityFactory, PoliciesGuard } from './casl-ability.guard';
import { FirebaseAdminService } from './firebase-admin.service';

@Module({
  controllers: [AuthController],
  providers: [FirebaseAdminService, AuthGuard, PoliciesGuard, CaslAbilityFactory],
  exports: [FirebaseAdminService, AuthGuard, PoliciesGuard, CaslAbilityFactory],
})
export class AuthModule {}
