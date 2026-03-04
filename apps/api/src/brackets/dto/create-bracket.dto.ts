import { ApiProperty } from '@nestjs/swagger';

export class CreateBracketDto {
  @ApiProperty({ description: 'Firebase anonymous user ID', example: 'abc123' })
  userId!: string;

  @ApiProperty({ description: 'User-chosen bracket name', example: 'My Championship Picks' })
  bracketName!: string;

  @ApiProperty({
    description: 'Map of matchup IDs to winning team IDs (63 total)',
    example: { 'R1-M1': 'team-5', 'R1-M2': 'team-12' },
  })
  picks!: Record<string, string>;
}
