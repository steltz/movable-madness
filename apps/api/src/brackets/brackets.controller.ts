import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BracketsService } from './brackets.service';

@ApiTags('Brackets')
@Controller('brackets')
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

  @Get(':bracketId')
  @ApiOperation({ summary: 'Get a bracket by ID' })
  @ApiResponse({ status: 200, description: 'Returns the bracket document' })
  @ApiResponse({ status: 404, description: 'Bracket not found' })
  getBracket(@Param('bracketId') bracketId: string) {
    return this.bracketsService.getBracketById(bracketId);
  }
}
