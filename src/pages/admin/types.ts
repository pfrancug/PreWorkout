import type { MessageLimitMode } from '@firebase-config/database';

export interface IUserWithLimits {
  uid: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  lastLogin: string | null;
  limitMode: MessageLimitMode;
  deleted?: boolean;
  isTrainer?: boolean;
  stats?: {
    todayMessages: number;
    totalMessages: number;
    averageDaily: number;
    allTimeTotal: number;
  } | null;
}
