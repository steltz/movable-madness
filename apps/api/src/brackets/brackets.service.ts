import type { BracketDocument } from '@movable-madness/shared-types';
import { Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class BracketsService {
  async findById(bracketId: string): Promise<BracketDocument | null> {
    const doc = await getFirestore().collection('brackets').doc(bracketId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...(doc.data() as Omit<BracketDocument, 'id'>),
    };
  }
}
