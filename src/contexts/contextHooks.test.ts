import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAuth } from './useAuth';
import { useDataSet } from './useDataSet';
import { useSettings } from './useSettings';

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );
  });
});

describe('useSettings', () => {
  it('throws when used outside SettingsProvider', () => {
    expect(() => renderHook(() => useSettings())).toThrow(
      'useSettings must be used within a SettingsProvider',
    );
  });
});

describe('useDataSet', () => {
  it('throws when used outside DataProvider', () => {
    expect(() => renderHook(() => useDataSet())).toThrow(
      'useDataSet must be used within a DataProvider',
    );
  });
});
