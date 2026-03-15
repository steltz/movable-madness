import type { ApiResponse, BracketDocument } from '@movable-madness/shared-types';
import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { BracketsService } from './brackets.service';

@ApiTags('Brackets')
@Controller('brackets')
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

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
