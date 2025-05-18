
import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export interface Confession {
  id?: string;
  content: string;
  createdAt: Timestamp | Date | any;
  isAnonymous: boolean;
  author?: string;
  authorId?: string;
  isHidden?: boolean;
}

export type User = FirebaseUser | null;