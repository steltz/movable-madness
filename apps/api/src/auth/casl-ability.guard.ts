import { type AppAbility, type AuthUser, createAbilityForUser } from '@movable-madness/auth';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CHECK_POLICIES_KEY,
  type PolicyHandler,
  type PolicyTuple,
} from './decorators/check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<(PolicyHandler | PolicyTuple)[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    // If no policies defined, allow access
    if (policyHandlers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const ability = createAbilityForUser(user);

    const allowed = policyHandlers.every((handler) => {
      if (typeof handler === 'function') {
        return handler(ability);
      }
      // Tuple format: [action, subject]
      const [action, subject] = handler;
      return ability.can(action, subject);
    });

    if (!allowed) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}

/**
 * Injectable factory for creating CASL abilities.
 * Used when you need to create abilities outside of guards.
 */
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthUser): AppAbility {
    return createAbilityForUser(user);
  }
}
