import type { IActivityCategory } from './types';
import type { ITrainerConnection } from '@app-types/types';

import {
  equalTo,
  get,
  orderByChild,
  push,
  query,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from 'firebase/database';
import { onValue } from 'firebase/database';

import {
  loadActivityCategories,
  saveActivityCategories,
} from './activity-categories';
import { database } from './db';
import { getUserDisplayName } from './user-directory';

/** Generate a short random invite code (6 chars, alphanumeric uppercase) */
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
  const randomValues = crypto.getRandomValues(new Uint8Array(6));
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[randomValues[i] % chars.length];
  }

  return code;
};

/**
 * Trainer creates an invite code for a trainee to use.
 * Returns the invite code and connection ID.
 */
export const createTrainerInvite = async (
  trainerId: string,
  note?: string,
): Promise<{ inviteCode: string; connectionId: string }> => {
  // Create the connection record first so we have a stable connectionId
  const connectionsRef = ref(database, 'trainerConnections');
  const newConnectionRef = push(connectionsRef);
  const connectionId = newConnectionRef.key!;

  // Reserve a unique invite code via transaction (retry on collision)
  let inviteCode = '';
  let reserved = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    inviteCode = generateInviteCode();
    const inviteRef = ref(database, `trainerInvites/${inviteCode}`);
    const { committed } = await runTransaction(inviteRef, (current) => {
      if (current !== null) {
        return; // abort — code already taken
      }

      // Write final shape atomically — no placeholder window
      return { trainerId, connectionId };
    });

    if (committed) {
      reserved = true;
      break;
    }
  }

  if (!reserved) {
    throw new Error('Failed to generate unique invite code');
  }

  const connectionData: Record<string, unknown> = {
    trainerId,
    traineeId: '', // Will be filled when trainee accepts
    status: 'pending' as const,
    inviteCode,
    createdAt: Date.now(),
  };

  if (note) {
    connectionData.note = note;
  }

  try {
    await set(newConnectionRef, connectionData);
  } catch (err) {
    // Clean up the reserved invite on failure
    await remove(ref(database, `trainerInvites/${inviteCode}`)).catch(() => {});
    throw err;
  }

  return { inviteCode, connectionId };
};

/**
 * Trainee accepts a trainer invite by entering the invite code.
 * Sets the connection to active and stores trainerId on the user.
 */
export const acceptTrainerInvite = async (
  traineeId: string,
  inviteCode: string,
): Promise<{ success: boolean; error?: string }> => {
  // Look up the invite
  const inviteSnapshot = await get(
    ref(database, `trainerInvites/${inviteCode.toUpperCase()}`),
  );

  if (!inviteSnapshot.exists()) {
    return { success: false, error: 'invalid_code' };
  }

  const { trainerId, connectionId } = inviteSnapshot.val() as {
    trainerId: string;
    connectionId: string;
  };

  // Check if trainee already has a trainer
  const existingTrainer = await get(
    ref(database, `users/${traineeId}/trainerId`),
  );
  if (existingTrainer.exists()) {
    return { success: false, error: 'already_has_trainer' };
  }

  // Claim the connection — security rules enforce that only a pending
  // connection can transition to active with the caller's traineeId,
  // so a race between two trainees is prevented server-side.
  const connectionRef = ref(database, `trainerConnections/${connectionId}`);
  try {
    await update(connectionRef, { traineeId, status: 'active' });
  } catch {
    return { success: false, error: 'invite_already_used' };
  }

  // Set trainerId + trainerConnectionId atomically (validate requires both)
  await update(ref(database), {
    [`users/${traineeId}/trainerId`]: trainerId,
    [`users/${traineeId}/trainerConnectionId`]: connectionId,
  });

  // Remove the invite code (one-time use)
  await remove(ref(database, `trainerInvites/${inviteCode.toUpperCase()}`));

  // Auto-create trainer activity category for the trainee
  try {
    const trainerName = (await getUserDisplayName(trainerId)) || 'Trainer';
    const existingCategories = await loadActivityCategories(traineeId);
    const categories = existingCategories ?? [];

    // Check if a trainer category already exists (may be archived from previous connection)
    const existingTrainerCat = categories.find(
      (c) => c.trainerId === trainerId,
    );
    if (existingTrainerCat) {
      // Unarchive existing category on reconnect
      if (existingTrainerCat.archived) {
        const updated = categories.map((c) => {
          if (c.trainerId !== trainerId) {
            return c;
          }
          const copy = { ...c };
          delete copy.archived;

          return copy;
        });
        await saveActivityCategories(traineeId, updated);
      }
    } else {
      const trainerCategory: IActivityCategory = {
        id: `trainer-${trainerId}`,
        icon: 'heart-pulse',
        name: `Training with ${trainerName}`,
        color: 'sky',
        trainerId,
        systemGenerated: true,
      };
      await saveActivityCategories(traineeId, [...categories, trainerCategory]);
    }
  } catch {
    // Non-critical — connection still succeeds even if category creation fails
  }

  return { success: true };
};

/**
 * Update the note on a pending invite / connection.
 */
export const updateConnectionNote = async (
  connectionId: string,
  note: string,
): Promise<void> => {
  await update(ref(database, `trainerConnections/${connectionId}`), { note });
};

/**
 * Delete a pending invite (removes connection + invite lookup).
 * Only hard-deletes truly pending connections; non-pending are soft-deleted.
 */
export const deletePendingInvite = async (
  connectionId: string,
): Promise<void> => {
  const snap = await get(ref(database, `trainerConnections/${connectionId}`));
  if (!snap.exists()) {
    return;
  }

  const { inviteCode, status } = snap.val() as {
    inviteCode?: string;
    status?: string;
  };

  if (inviteCode) {
    await remove(ref(database, `trainerInvites/${inviteCode}`));
  }

  if (status === 'pending') {
    await remove(ref(database, `trainerConnections/${connectionId}`));
  } else {
    await update(ref(database, `trainerConnections/${connectionId}`), {
      status: 'deleted',
    });
  }
};

/**
 * Either party can disconnect the trainer–trainee relationship.
 */
export const disconnectTrainer = async (
  connectionId: string,
  traineeId: string,
): Promise<void> => {
  // Read the connection to find the trainerId before soft-deleting
  const connSnap = await get(
    ref(database, `trainerConnections/${connectionId}`),
  );
  const trainerId = connSnap.exists()
    ? (connSnap.val() as ITrainerConnection).trainerId
    : null;

  // Soft-delete: preserve node so trainingSessions rules still resolve
  await update(ref(database, `trainerConnections/${connectionId}`), {
    status: 'deleted',
  });

  // Remove trainerId + trainerConnectionId from the user
  await update(ref(database), {
    [`users/${traineeId}/trainerId`]: null,
    [`users/${traineeId}/trainerConnectionId`]: null,
  });

  // Archive trainer activity category (keeps historical calendar data intact)
  if (trainerId) {
    try {
      const categories = await loadActivityCategories(traineeId);
      if (categories) {
        const updated = categories.map((c) =>
          c.trainerId === trainerId ? { ...c, archived: true } : c,
        );
        await saveActivityCategories(traineeId, updated);
      }
    } catch {
      // Non-critical — disconnect still succeeds
    }
  }
};

/**
 * Subscribe to all connections where the given user is the trainer.
 */
export const subscribeToTrainerConnections = (
  trainerId: string,
  callback: (connections: ITrainerConnection[]) => void,
): (() => void) => {
  const connectionsRef = ref(database, 'trainerConnections');
  const q = query(
    connectionsRef,
    orderByChild('trainerId'),
    equalTo(trainerId),
  );

  const unsubscribe = onValue(q, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, ITrainerConnection>;
      const connections = Object.entries(data).map(([key, val]) => ({
        ...val,
        id: key,
      }));
      callback(connections);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};

/**
 * Subscribe to the trainee's active trainer connection.
 */
export const subscribeToTraineeConnection = (
  traineeId: string,
  callback: (connection: ITrainerConnection | null) => void,
): (() => void) => {
  const connectionsRef = ref(database, 'trainerConnections');
  const q = query(
    connectionsRef,
    orderByChild('traineeId'),
    equalTo(traineeId),
  );

  const unsubscribe = onValue(q, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, ITrainerConnection>;
      const active = Object.entries(data).find(
        ([, val]) => val.status === 'active',
      );
      if (active) {
        callback({ ...active[1], id: active[0] });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

/**
 * Get user's trainerId (the trainer assigned to them).
 */
export const getTrainerId = async (userId: string): Promise<string | null> => {
  const snapshot = await get(ref(database, `users/${userId}/trainerId`));

  return snapshot.exists() ? (snapshot.val() as string) : null;
};
