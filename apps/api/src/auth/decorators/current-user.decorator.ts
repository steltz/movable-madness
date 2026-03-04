import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@workspace/auth';

/**
 * Parameter decorator to extract the current authenticated user from the request.
 * Requires AuthGuard to be applied to the route.
 *
 * @example
 * ```typescript
 * @Get('me')
 * @UseGuards(AuthGuard)
 * getMe(@CurrentUser() user: AuthUser) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
