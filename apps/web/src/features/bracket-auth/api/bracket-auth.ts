import { signInAnonymously as firebaseSignInAnonymously, type User } from 'firebase/auth';
import { getFirebaseAuth } from '../../../shared/config/firebase';

export async function signInAnonymously(): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await firebaseSignInAnonymously(auth);
  return credential.user;
}
