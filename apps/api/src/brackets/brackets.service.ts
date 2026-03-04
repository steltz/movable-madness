import { BadRequestException, Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import type { CreateBracketDto } from './dto/create-bracket.dto';

const TOTAL_PICKS = 63;
const VALID_TEAM_IDS = new Set(Array.from({ length: 64 }, (_, i) => `team-${i + 1}`));
const MAX_BRACKET_NAME_LENGTH = 100;

const ROUND_MATCHUP_COUNTS: Record<number, number> = {
  1: 32,
  2: 16,
  3: 8,
  4: 4,
  5: 2,
  6: 1,
};

const VALID_MATCHUP_IDS = new Set(
  Object.entries(ROUND_MATCHUP_COUNTS).flatMap(([round, count]) =>
    Array.from({ length: count }, (_, i) => `R${round}-M${i + 1}`),
  ),
);

@Injectable()
export class BracketsService {
  async createBracket(dto: CreateBracketDto) {
    this.validate(dto);

    const data = {
      userId: dto.userId,
      bracketName: dto.bracketName,
      picks: dto.picks,
      submittedAt: new Date().toISOString(),
    };
    const db = getFirestore();
    const docRef = await db.collection('brackets').add(data);

    return { id: docRef.id, ...data };
  }

  private validate(dto: CreateBracketDto): void {
    if (!dto.userId || typeof dto.userId !== 'string') {
      throw new BadRequestException('userId is required and must be a string');
    }

    if (!dto.bracketName || typeof dto.bracketName !== 'string') {
      throw new BadRequestException('bracketName is required and must be a string');
    }

    if (dto.bracketName.length > MAX_BRACKET_NAME_LENGTH) {
      throw new BadRequestException(
        `bracketName must be ${MAX_BRACKET_NAME_LENGTH} characters or fewer`,
      );
    }

    if (!dto.picks || typeof dto.picks !== 'object' || Array.isArray(dto.picks)) {
      throw new BadRequestException('picks must be an object');
    }

    const pickEntries = Object.entries(dto.picks);

    if (pickEntries.length !== TOTAL_PICKS) {
      throw new BadRequestException(`Expected ${TOTAL_PICKS} picks, got ${pickEntries.length}`);
    }

    for (const [matchupId, teamId] of pickEntries) {
      if (!VALID_MATCHUP_IDS.has(matchupId)) {
        throw new BadRequestException(`Invalid matchup ID: ${matchupId}`);
      }
      if (!VALID_TEAM_IDS.has(teamId)) {
        throw new BadRequestException(`Invalid team ID: ${teamId}`);
      }
    }

    this.validatePickConsistency(dto.picks);
  }

  private validatePickConsistency(picks: Record<string, string>): void {
    for (let round = 2; round <= 6; round++) {
      const matchupCount = ROUND_MATCHUP_COUNTS[round];
      for (let m = 1; m <= matchupCount; m++) {
        const matchupId = `R${round}-M${m}`;
        const winnerId = picks[matchupId];
        if (!winnerId) continue;

        const feeder1 = `R${round - 1}-M${m * 2 - 1}`;
        const feeder2 = `R${round - 1}-M${m * 2}`;
        const feeder1Winner = picks[feeder1];
        const feeder2Winner = picks[feeder2];

        if (winnerId !== feeder1Winner && winnerId !== feeder2Winner) {
          throw new BadRequestException(
            `Pick consistency error: ${winnerId} in ${matchupId} did not win in either feeder matchup (${feeder1}, ${feeder2})`,
          );
        }
      }
    }
  }
}
