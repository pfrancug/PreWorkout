import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockSet, mockRef, mockRemove, mockOnValue } = vi.hoisted(
  () => ({
    mockGet: vi.fn(),
    mockSet: vi.fn().mockResolvedValue(undefined),
    mockRef: vi.fn((_db: unknown, path?: string) => ({ _path: path })),
    mockRemove: vi.fn().mockResolvedValue(undefined),
    mockOnValue: vi.fn(),
  }),
);

vi.mock('firebase/database', () => ({
  get: mockGet,
  ref: mockRef,
  remove: mockRemove,
  set: mockSet,
  onValue: mockOnValue,
}));

vi.mock('./db', () => ({ database: {} }));

import {
  clearUserMessages,
  loadUserMessages,
  saveUserMessages,
  subscribeToUserMessages,
} from './messages';

const makeSnap = (exists: boolean, val?: unknown) => ({
  exists: () => exists,
  val: () => val,
});

describe('messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveUserMessages', () => {
    it('strips unexpected properties from messages', async () => {
      const messages = [
        {
          role: 'user' as const,
          parts: [{ text: 'hello' }],
          _internalId: 'abc',
        },
      ];
      await saveUserMessages('uid-1', messages as never);

      const saved = mockSet.mock.calls[0][1];
      expect(saved).toEqual([{ role: 'user', parts: [{ text: 'hello' }] }]);
    });

    it('preserves attachedDataset when present', async () => {
      const messages = [
        {
          role: 'user' as const,
          parts: [{ text: 'analyze this' }],
          attachedDataset: [
            {
              id: 1,
              date: new Date('2025-01-01'),
              kcal: 2000,
              protein: null,
              carbs: null,
              fat: null,
              weight: null,
              completed: false,
            },
          ],
        },
      ];
      await saveUserMessages('uid-1', messages);

      const saved = mockSet.mock.calls[0][1];
      expect(saved[0].attachedDataset).toBeDefined();
      expect(saved[0].attachedDataset).toHaveLength(1);
    });

    it('omits attachedDataset key when not present', async () => {
      const messages = [{ role: 'model' as const, parts: [{ text: 'hi' }] }];
      await saveUserMessages('uid-1', messages);

      const saved = mockSet.mock.calls[0][1];
      expect('attachedDataset' in saved[0]).toBe(false);
    });
  });

  describe('clearUserMessages', () => {
    it('removes the messages ref', async () => {
      await clearUserMessages('uid-1');

      expect(mockRef).toHaveBeenCalledWith({}, 'users/uid-1/messages');
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('loadUserMessages', () => {
    it('returns Object.values of snapshot (normalises object to array)', async () => {
      const data = {
        0: { role: 'user', parts: [{ text: 'hi' }] },
        1: { role: 'model', parts: [{ text: 'hello' }] },
      };
      mockGet.mockResolvedValue(makeSnap(true, data));
      const result = await loadUserMessages('uid-1');

      expect(result).toEqual([
        { role: 'user', parts: [{ text: 'hi' }] },
        { role: 'model', parts: [{ text: 'hello' }] },
      ]);
    });

    it('returns null when no messages exist', async () => {
      mockGet.mockResolvedValue(makeSnap(false));
      const result = await loadUserMessages('uid-1');

      expect(result).toBeNull();
    });
  });

  describe('subscribeToUserMessages', () => {
    it('invokes callback with messages from snapshot', () => {
      const msgs = {
        0: { role: 'user', parts: [{ text: 'hi' }] },
      };
      mockOnValue.mockImplementation(
        (_ref: unknown, cb: (snap: unknown) => void) => {
          cb({ val: () => msgs });

          return vi.fn();
        },
      );

      const callback = vi.fn();
      subscribeToUserMessages('uid-1', callback);

      expect(callback).toHaveBeenCalledWith([
        { role: 'user', parts: [{ text: 'hi' }] },
      ]);
    });

    it('invokes callback with empty array when snapshot is null', () => {
      mockOnValue.mockImplementation(
        (_ref: unknown, cb: (snap: unknown) => void) => {
          cb({ val: () => null });

          return vi.fn();
        },
      );

      const callback = vi.fn();
      subscribeToUserMessages('uid-1', callback);

      expect(callback).toHaveBeenCalledWith([]);
    });
  });
});
