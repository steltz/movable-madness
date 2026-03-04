import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Actions, type AuthUser } from '@workspace/auth';
import { AuthGuard } from '../auth/auth.guard';
import { PoliciesGuard } from '../auth/casl-ability.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard, PoliciesGuard)
@ApiBearerAuth()
export class UsersController {
  @Get()
  @CheckPolicies([Actions.READ, 'User'])
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of users',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getUsers(@CurrentUser() currentUser: AuthUser) {
    // In a real implementation, this would fetch from Firestore
    // For now, return the current user as a demo
    return {
      success: true,
      data: [currentUser],
    };
  }

  @Get(':uid')
  @CheckPolicies([Actions.READ, 'User'])
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'uid',
    description: 'User Firebase UID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user information',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserById(@Param('uid') uid: string, @CurrentUser() currentUser: AuthUser) {
    // In a real implementation, this would fetch from Firestore
    // For now, check if requesting own profile
    if (uid === currentUser.uid) {
      return {
        success: true,
        data: currentUser,
      };
    }

    // Demo: only the current user is "found"
    throw new NotFoundException('User not found');
  }
}
