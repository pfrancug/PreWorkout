import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, verifyAuthToken } from '../lib/auth.js';

/**
 * POST /api/admin/set-trainer
 *
 * Sets or revokes the `trainer` custom claim on a user.
 * Only admins can call this endpoint.
 *
 * Body: { targetUid: string, isTrainer: boolean }
 */
const handler = async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const uid = await verifyAuthToken(req.headers.authorization);
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Verify the caller is an admin
    const callerRecord = await adminAuth.getUser(uid);
    if (!callerRecord.customClaims?.admin) {
      res.status(403).json({ error: 'Forbidden: admin only' });
      return;
    }

    const { targetUid, isTrainer } = req.body as {
      targetUid: string;
      isTrainer: boolean;
    };

    if (
      typeof targetUid !== 'string' ||
      targetUid.length === 0 ||
      targetUid.length > 128 ||
      typeof isTrainer !== 'boolean'
    ) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // Preserve existing claims
    const targetUser = await adminAuth.getUser(targetUid);
    const existingClaims = targetUser.customClaims ?? {};

    if (isTrainer) {
      await adminAuth.setCustomUserClaims(targetUid, {
        ...existingClaims,
        trainer: true,
      });
    } else {
      const { trainer: _, ...rest } = existingClaims;
      await adminAuth.setCustomUserClaims(targetUid, rest);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to set trainer claim:', error);
    res.status(500).json({ error: 'Failed to update trainer claim' });
  }
};

export default handler;
