import { ApiProperty } from '@nestjs/swagger';

export class CreateBracketUserDto {
  @ApiProperty({ description: 'Display name for the bracket entry', example: 'My March Picks' })
  bracketName!: string;
}
