import type { ApiResponse, BracketDocument } from '@movable-madness/shared-types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class BracketsService {
  async getBracketById(bracketId: string): Promise<ApiResponse<BracketDocument>> {
    const doc = await getFirestore().collection('brackets').doc(bracketId).get();

    if (!doc.exists) {
      throw new NotFoundException(`Bracket ${bracketId} not found`);
    }

    const data = doc.data() as BracketDocument;

    return {
      success: true,
      data: {
        bracketName: data.bracketName,
        userId: data.userId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        picks: data.picks ?? {},
        teams: data.teams ?? [],
      },
      timestamp: new Date().toISOString(),
    };
  }
}
