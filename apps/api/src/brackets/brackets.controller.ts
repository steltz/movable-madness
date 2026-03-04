import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BracketsService } from './brackets.service';
import { CreateBracketDto } from './dto/create-bracket.dto';

@ApiTags('Brackets')
@Controller('v1/brackets')
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a completed bracket' })
  @ApiResponse({ status: 201, description: 'Bracket saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid bracket data' })
  async createBracket(@Body() dto: CreateBracketDto) {
    const bracket = await this.bracketsService.createBracket(dto);
    return { success: true, data: bracket };
  }
}
