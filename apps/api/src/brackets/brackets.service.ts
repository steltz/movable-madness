import type { BracketDocument } from '@movable-madness/shared-types';
import { Injectable } from '@nestjs/common';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class BracketsService {
  async joinBracket(uid: string, bracketName: string): Promise<{ isNew: boolean }> {
    const trimmedName = bracketName.trim();
    const db = getFirestore();
    const docRef = db.collection('bracketEntries').doc(uid);
    const doc = await docRef.get();

    if (doc.exists) {
      await docRef.set(
        {
          bracketName: trimmedName,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { isNew: false };
    }

    await docRef.set(
      {
        bracketName: trimmedName,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: false },
    );
    return { isNew: true };
  }

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
