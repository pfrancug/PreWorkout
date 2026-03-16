import { fromFirebaseFormat } from '@lib/data-format';
import { describe, expect, it } from 'vitest';

describe('fromFirebaseFormat', () => {
  it('converts YYYY-MM-DD date to local Date object', () => {
    const result = fromFirebaseFormat([
      {
        id: 1,
        date: '2024-06-15',
        weight: 75,
        kcal: 2000,
        protein: 150,
        fat: 60,
        carbs: 200,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date.getFullYear()).toBe(2024);
    expect(result[0].date.getMonth()).toBe(5); // June = 5 (0-indexed)
    expect(result[0].date.getDate()).toBe(15);
  });

  it('converts legacy ISO string to local Date object', () => {
    const result = fromFirebaseFormat([
      {
        id: 1,
        date: '2024-01-15T00:00:00.000Z',
        weight: null,
        kcal: null,
        protein: null,
        fat: null,
        carbs: null,
      },
    ]);

    expect(result[0].date.getFullYear()).toBe(2024);
    expect(result[0].date.getMonth()).toBe(0); // January = 0
    expect(result[0].date.getDate()).toBe(15);
  });

  it('defaults completed to false when missing', () => {
    const result = fromFirebaseFormat([
      {
        id: 1,
        date: '2024-01-15',
        weight: null,
        kcal: null,
        protein: null,
        fat: null,
        carbs: null,
      },
    ]);

    expect(result[0].completed).toBe(false);
  });

  it('preserves completed: true', () => {
    const result = fromFirebaseFormat([
      {
        id: 1,
        date: '2024-01-15',
        weight: null,
        kcal: null,
        protein: null,
        fat: null,
        carbs: null,
        completed: true,
      },
    ]);

    expect(result[0].completed).toBe(true);
  });

  it('preserves all numeric fields', () => {
    const result = fromFirebaseFormat([
      {
        id: 42,
        date: '2024-03-01',
        weight: 80.5,
        kcal: 2500,
        protein: 180,
        fat: 70,
        carbs: 250,
      },
    ]);

    expect(result[0].id).toBe(42);
    expect(result[0].weight).toBe(80.5);
    expect(result[0].kcal).toBe(2500);
    expect(result[0].protein).toBe(180);
    expect(result[0].fat).toBe(70);
    expect(result[0].carbs).toBe(250);
  });

  it('preserves null numeric fields', () => {
    const result = fromFirebaseFormat([
      {
        id: 1,
        date: '2024-01-01',
        weight: null,
        kcal: null,
        protein: null,
        fat: null,
        carbs: null,
      },
    ]);

    expect(result[0].weight).toBeNull();
    expect(result[0].kcal).toBeNull();
    expect(result[0].protein).toBeNull();
    expect(result[0].fat).toBeNull();
    expect(result[0].carbs).toBeNull();
  });

  it('converts multiple rows', () => {
    const result = fromFirebaseFormat([
      {
        id: 1,
        date: '2024-01-01',
        weight: null,
        kcal: null,
        protein: null,
        fat: null,
        carbs: null,
      },
      {
        id: 2,
        date: '2024-12-31',
        weight: 90,
        kcal: 3000,
        protein: null,
        fat: null,
        carbs: null,
      },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].date.getMonth()).toBe(0);
    expect(result[1].date.getMonth()).toBe(11);
  });

  it('returns empty array for empty input', () => {
    expect(fromFirebaseFormat([])).toEqual([]);
  });
});
