import type { AuthUser } from '@movable-madness/auth';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BracketUsersService } from './bracket-users.service';
import { CreateBracketUserDto } from './dto/create-bracket-user.dto';

@ApiTags('Bracket Users')
@Controller('bracket-users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BracketUsersController {
  constructor(private readonly bracketUsersService: BracketUsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create bracket user profile' })
  @ApiResponse({ status: 201, description: 'Bracket user profile created' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBracketUserDto) {
    const data = await this.bracketUsersService.create(user.uid, dto.bracketName);
    return { success: true, data };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current bracket user profile' })
  @ApiResponse({ status: 200, description: 'Returns bracket user profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMe(@CurrentUser() user: AuthUser) {
    const data = await this.bracketUsersService.findByUid(user.uid);
    return { success: true, data };
  }
}
