import type { BracketDocument, BracketSubmission } from '@movable-madness/shared-types';
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

  async submitBracket(uid: string, submission: BracketSubmission): Promise<string> {
    const db = getFirestore();

    const picks: Record<string, string> = {};
    for (const [key, value] of Object.entries(submission.picks)) {
      if (value != null) {
        picks[key] = String(value);
      }
    }

    const existing = await this.findByUserId(uid);

    if (existing?.id) {
      const docRef = db.collection('brackets').doc(existing.id);
      await docRef.update({
        picks,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return existing.id;
    }

    const docRef = db.collection('brackets').doc();
    await docRef.set({
      bracketName: submission.bracketName,
      userId: uid,
      picks,
      teams: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return docRef.id;
  }

  async findByUserId(uid: string): Promise<BracketDocument | null> {
    const snapshot = await getFirestore()
      .collection('brackets')
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...(doc.data() as Omit<BracketDocument, 'id'>),
    };
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
