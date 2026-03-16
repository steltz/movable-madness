import type { AuthUser } from '@movable-madness/auth';
import type {
  ApiResponse,
  BracketDocument,
  BracketSubmission,
} from '@movable-madness/shared-types';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BracketsService } from './brackets.service';

interface JoinBracketBody {
  bracketName: string;
}

@ApiTags('Brackets')
@Controller('brackets')
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Submit a completed bracket' })
  @SwaggerResponse({ status: 201, description: 'Bracket submitted successfully' })
  @SwaggerResponse({ status: 400, description: 'Invalid bracket submission' })
  async submit(
    @CurrentUser() user: AuthUser,
    @Body() body: BracketSubmission,
  ): Promise<ApiResponse<{ bracketId: string }>> {
    const bracketId = await this.bracketsService.submitBracket(user.uid, body);

    return {
      success: true,
      data: { bracketId },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('join')
  @UseGuards(AuthGuard)
  async join(@CurrentUser() user: AuthUser, @Body() body: JoinBracketBody) {
    const trimmedName = body.bracketName?.trim();

    if (!trimmedName || trimmedName.length === 0) {
      throw new BadRequestException('Bracket name is required');
    }

    if (trimmedName.length > 50) {
      throw new BadRequestException('Bracket name must be 50 characters or less');
    }

    await this.bracketsService.joinBracket(user.uid, trimmedName);

    return {
      success: true,
      data: { bracketName: trimmedName },
    };
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Get the current user's bracket" })
  @SwaggerResponse({ status: 200, description: "Returns the user's bracket" })
  @SwaggerResponse({ status: 404, description: 'No bracket found for user' })
  async getMyBracket(@CurrentUser() user: AuthUser, @Res() res: Response): Promise<void> {
    const bracket = await this.bracketsService.findByUserId(user.uid);

    if (!bracket) {
      const errorResponse: ApiResponse<never> = {
        success: false,
        error: {
          code: 'BRACKET_NOT_FOUND',
          message: 'Bracket not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiResponse<BracketDocument> = {
      success: true,
      data: bracket,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  }

  @Get(':bracketId')
  @ApiOperation({ summary: 'Get a bracket by ID' })
  @ApiParam({
    name: 'bracketId',
    description: 'Firestore bracket document ID',
    type: String,
  })
  @SwaggerResponse({
    status: 200,
    description: 'Returns the bracket document',
  })
  @SwaggerResponse({
    status: 404,
    description: 'Bracket not found',
  })
  async getBracket(@Param('bracketId') bracketId: string, @Res() res: Response): Promise<void> {
    const bracket = await this.bracketsService.findById(bracketId);

    if (!bracket) {
      const errorResponse: ApiResponse<never> = {
        success: false,
        error: {
          code: 'BRACKET_NOT_FOUND',
          message: 'Bracket not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiResponse<BracketDocument> = {
      success: true,
      data: bracket,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  }
}
