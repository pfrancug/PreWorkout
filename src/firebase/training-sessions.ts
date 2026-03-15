import type { ITrainingSession } from '@app-types/types';

import { push, ref, remove, set, update } from 'firebase/database';
import { onValue } from 'firebase/database';

import { database } from './db';

export const subscribeToTrainingSessions = (
  connectionId: string,
  callback: (sessions: ITrainingSession[]) => void,
): (() => void) => {
  const sessionsRef = ref(database, `trainingSessions/${connectionId}`);

  const unsubscribe = onValue(sessionsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, ITrainingSession>;
      const sessions = Object.entries(data).map(([id, val]) => ({
        ...val,
        id,
      }));
      sessions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      callback(sessions);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};

export const createTrainingSession = async (
  connectionId: string,
  trainerId: string,
  traineeId: string,
  date: string,
  time?: string | null,
  timeEnd?: string | null,
): Promise<string> => {
  const sessionsRef = ref(database, `trainingSessions/${connectionId}`);
  const newRef = push(sessionsRef);

  const session: Omit<ITrainingSession, 'id'> = {
    connectionId,
    trainerId,
    traineeId,
    date,
    time: time ?? null,
    timeEnd: timeEnd ?? null,
    status: 'planned',
    trainerConfirmed: true,
    paymentStatus: 'unpaid',
    paidMarkedBy: null,
    createdAt: Date.now(),
    createdBy: 'trainer',
  };

  await set(newRef, session);

  return newRef.key!;
};

export const completeSession = async (
  connectionId: string,
  sessionId: string,
): Promise<void> => {
  const sessionRef = ref(
    database,
    `trainingSessions/${connectionId}/${sessionId}`,
  );
  await update(sessionRef, {
    status: 'completed',
  });
};

export const cancelSession = async (
  connectionId: string,
  sessionId: string,
  cancelledBy: 'trainer' | 'trainee',
): Promise<void> => {
  const sessionRef = ref(
    database,
    `trainingSessions/${connectionId}/${sessionId}`,
  );
  await update(sessionRef, {
    status: 'cancelled',
    cancelledBy,
    paymentStatus: 'unpaid',
    paidMarkedBy: null,
  });
};

export const reactivateSession = async (
  connectionId: string,
  sessionId: string,
): Promise<void> => {
  const sessionRef = ref(
    database,
    `trainingSessions/${connectionId}/${sessionId}`,
  );
  await update(sessionRef, {
    status: 'planned',
    cancelledBy: null,
  });
};

export const updateSessionTime = async (
  connectionId: string,
  sessionId: string,
  time: string | null,
  timeEnd?: string | null,
): Promise<void> => {
  const sessionRef = ref(
    database,
    `trainingSessions/${connectionId}/${sessionId}`,
  );
  await update(sessionRef, { time, timeEnd: timeEnd ?? null });
};

export const updateSessionNote = async (
  connectionId: string,
  sessionId: string,
  note: string,
): Promise<void> => {
  const sessionRef = ref(
    database,
    `trainingSessions/${connectionId}/${sessionId}`,
  );
  await update(sessionRef, { note: note || null });
};

/** Trainer marks session as paid (immediate, no confirmation needed). */
export const markSessionPaid = async (
  connectionId: string,
  sessionId: string,
): Promise<void> => {
  const sessionRef = ref(
    database,
    `trainingSessions/${connectionId}/${sessionId}`,
  );
  await update(sessionRef, {
    paymentStatus: 'paid',
    paidMarkedBy: 'trainer',
  });
};

/** Trainer marks session as unpaid (revert a payment). */
export const markSessionUnpaid = async (
  connectionId: string,
  sessionId: string,
): Promise<void> => {
  const sessionRef = ref(
    database,
    `trainingSessions/${connectionId}/${sessionId}`,
  );
  await update(sessionRef, {
    paymentStatus: 'unpaid',
    paidMarkedBy: null,
  });
};

export const deleteTrainingSession = async (
  connectionId: string,
  sessionId: string,
): Promise<void> => {
  await remove(ref(database, `trainingSessions/${connectionId}/${sessionId}`));
};

/** Group sessions into a package (shared packageId). */
export const groupSessionsAsPackage = async (
  connectionId: string,
  sessionIds: string[],
): Promise<string> => {
  const packageId = push(
    ref(database, `trainingSessions/${connectionId}`),
  ).key!;
  const updates: Record<string, string> = {};
  for (const sid of sessionIds) {
    updates[`trainingSessions/${connectionId}/${sid}/packageId`] = packageId;
  }
  await update(ref(database), updates);

  return packageId;
};

/** Remove multiple sessions from their packages in a single write. */
export const batchRemoveFromPackage = async (
  connectionId: string,
  sessionIds: string[],
): Promise<void> => {
  const updates: Record<string, null> = {};
  for (const id of sessionIds) {
    updates[`trainingSessions/${connectionId}/${id}/packageId`] = null;
  }
  await update(ref(database), updates);
};

/** Mark all sessions in a package as paid. */
export const markPackagePaid = async (
  connectionId: string,
  packageId: string,
  sessions: ITrainingSession[],
): Promise<void> => {
  const inPackage = sessions.filter((s) => s.packageId === packageId);
  const updates: Record<string, unknown> = {};
  for (const s of inPackage) {
    updates[`trainingSessions/${connectionId}/${s.id}/paymentStatus`] = 'paid';
    updates[`trainingSessions/${connectionId}/${s.id}/paidMarkedBy`] =
      'trainer';
  }
  await update(ref(database), updates);
};

/** Mark all sessions in a package as unpaid. */
export const markPackageUnpaid = async (
  connectionId: string,
  packageId: string,
  sessions: ITrainingSession[],
): Promise<void> => {
  const inPackage = sessions.filter((s) => s.packageId === packageId);
  const updates: Record<string, unknown> = {};
  for (const s of inPackage) {
    updates[`trainingSessions/${connectionId}/${s.id}/paymentStatus`] =
      'unpaid';
    updates[`trainingSessions/${connectionId}/${s.id}/paidMarkedBy`] = null;
  }
  await update(ref(database), updates);
};
