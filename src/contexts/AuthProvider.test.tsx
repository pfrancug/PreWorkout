import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

// Mock firebase/auth
const mockOnAuthStateChanged = vi.fn();
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}));

vi.mock('@firebase-config/auth', () => ({
  auth: {},
}));

const mockUpdateUserDirectory = vi.fn().mockResolvedValue(undefined);
vi.mock('@firebase-config/database', () => ({
  updateUserDirectory: (...args: unknown[]) => mockUpdateUserDirectory(...args),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockImplementation(() => vi.fn()); // return unsubscribe
  });

  it('starts in loading state', () => {
    mockOnAuthStateChanged.mockImplementation(() => vi.fn());

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('sets user and claims on auth state change', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      // Simulate async auth callback
      setTimeout(() => {
        cb({
          uid: 'user-1',
          email: 'test@test.com',
          displayName: 'Test User',
          getIdTokenResult: () =>
            Promise.resolve({
              claims: { admin: true, trainer: false },
            }),
        });
      }, 0);

      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.uid).toBe('user-1');
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isTrainer).toBe(false);
  });

  it('sets isTrainer when trainer claim is true', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      setTimeout(() => {
        cb({
          uid: 'trainer-1',
          email: 'trainer@test.com',
          displayName: 'Trainer',
          getIdTokenResult: () =>
            Promise.resolve({
              claims: { admin: false, trainer: true },
            }),
        });
      }, 0);

      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isTrainer).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('resets to defaults on sign out', async () => {
    let authCallback: (user: unknown) => void;
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      authCallback = cb;
      // Start signed in
      setTimeout(() => {
        cb({
          uid: 'user-1',
          email: 'test@test.com',
          displayName: 'Test',
          getIdTokenResult: () =>
            Promise.resolve({ claims: { admin: true, trainer: true } }),
        });
      }, 0);

      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });

    // Simulate sign out
    authCallback!(null);

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isTrainer).toBe(false);
    });
  });

  it('calls updateUserDirectory on sign in', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      setTimeout(() => {
        cb({
          uid: 'user-1',
          email: 'test@test.com',
          displayName: 'Test User',
          getIdTokenResult: () => Promise.resolve({ claims: {} }),
        });
      }, 0);

      return vi.fn();
    });

    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(mockUpdateUserDirectory).toHaveBeenCalledWith(
        'user-1',
        'test@test.com',
        'Test User',
      );
    });
  });

  it('unsubscribes from auth on unmount', () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChanged.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
