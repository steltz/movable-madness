import type { BracketUserDocument } from '@movable-madness/shared-types';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class BracketUsersService {
  private get db() {
    return getFirestore();
  }

  async create(uid: string, bracketName: string): Promise<BracketUserDocument> {
    const docRef = this.db.collection('bracketUsers').doc(uid);
    const existing = await docRef.get();

    if (existing.exists) {
      throw new ConflictException('Bracket user profile already exists');
    }

    const now = new Date().toISOString();
    const data: BracketUserDocument = {
      uid,
      bracketName,
      createdAt: now,
    };

    await docRef.set(data);
    return data;
  }

  async findByUid(uid: string): Promise<BracketUserDocument> {
    const doc = await this.db.collection('bracketUsers').doc(uid).get();

    if (!doc.exists) {
      throw new NotFoundException('Bracket user profile not found');
    }

    return doc.data() as BracketUserDocument;
  }
}
