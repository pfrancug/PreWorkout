import type { ICalculatorForm } from '../types';

import { BMR_CONSTANTS, CALORIE_DEFICITS } from '@constants/storage';
import { describe, expect, it } from 'vitest';

import { calculate } from './calculate';

const maleDefaults: ICalculatorForm = {
  gender: 'male',
  age: 30,
  height: 175,
  weight: 75,
  activity: 1.725,
};

const femaleDefaults: ICalculatorForm = {
  gender: 'female',
  age: 25,
  height: 165,
  weight: 60,
  activity: 1.55,
};

describe('calculate', () => {
  describe('BMR (Mifflin-St Jeor)', () => {
    it('computes male BMR correctly', () => {
      // 10*75 + 6.25*175 - 5*30 + 5 = 750 + 1093.75 - 150 + 5 = 1698.75 → 1699
      const result = calculate(maleDefaults);

      expect(result.bmr).toBe(
        Math.round(
          BMR_CONSTANTS.WEIGHT_MULTIPLIER * 75 +
            BMR_CONSTANTS.HEIGHT_MULTIPLIER * 175 -
            BMR_CONSTANTS.AGE_MULTIPLIER * 30 +
            BMR_CONSTANTS.MALE_FACTOR,
        ),
      );
    });

    it('computes female BMR correctly', () => {
      // 10*60 + 6.25*165 - 5*25 + (-161) = 600 + 1031.25 - 125 - 161 = 1345.25 → 1345
      const result = calculate(femaleDefaults);

      expect(result.bmr).toBe(
        Math.round(
          BMR_CONSTANTS.WEIGHT_MULTIPLIER * 60 +
            BMR_CONSTANTS.HEIGHT_MULTIPLIER * 165 -
            BMR_CONSTANTS.AGE_MULTIPLIER * 25 +
            BMR_CONSTANTS.FEMALE_FACTOR,
        ),
      );
    });

    it('female BMR is lower than male BMR for same stats', () => {
      const sameStats: ICalculatorForm = {
        ...maleDefaults,
        gender: 'female',
      };
      const male = calculate(maleDefaults);
      const female = calculate(sameStats);

      expect(female.bmr).toBeLessThan(male.bmr);
      expect(male.bmr - female.bmr).toBe(
        BMR_CONSTANTS.MALE_FACTOR - BMR_CONSTANTS.FEMALE_FACTOR,
      );
    });
  });

  describe('maintenance (TDEE)', () => {
    it('equals BMR × activity multiplier', () => {
      const result = calculate(maleDefaults);

      expect(result.maintain).toBe(
        Math.round(result.bmr * maleDefaults.activity),
      );
    });

    it('sedentary activity yields lower TDEE', () => {
      const sedentary = calculate({ ...maleDefaults, activity: 1.2 });
      const active = calculate({ ...maleDefaults, activity: 1.725 });

      expect(sedentary.maintain).toBeLessThan(active.maintain);
    });
  });

  describe('deficit tiers', () => {
    it('mid = maintain - MILD deficit', () => {
      const result = calculate(maleDefaults);

      expect(result.mid).toBe(result.maintain - CALORIE_DEFICITS.MILD);
      expect(result.midDeficit).toBe(CALORIE_DEFICITS.MILD);
    });

    it('loss = maintain - MODERATE deficit', () => {
      const result = calculate(maleDefaults);

      expect(result.loss).toBe(result.maintain - CALORIE_DEFICITS.MODERATE);
      expect(result.lossDeficit).toBe(CALORIE_DEFICITS.MODERATE);
    });

    it('extreme = maintain - EXTREME deficit', () => {
      const result = calculate(maleDefaults);

      expect(result.extreme).toBe(result.maintain - CALORIE_DEFICITS.EXTREME);
      expect(result.extremeDeficit).toBe(CALORIE_DEFICITS.EXTREME);
    });

    it('deficit tiers are ordered: mid > loss > extreme', () => {
      const result = calculate(maleDefaults);

      expect(result.mid).toBeGreaterThan(result.loss);
      expect(result.loss).toBeGreaterThan(result.extreme);
    });
  });

  describe('edge cases', () => {
    it('handles activity multiplier of 1 (TDEE = BMR)', () => {
      const result = calculate({ ...maleDefaults, activity: 1 });

      expect(result.maintain).toBe(result.bmr);
    });

    it('all returned values are integers', () => {
      const result = calculate(femaleDefaults);

      expect(Number.isInteger(result.bmr)).toBe(true);
      expect(Number.isInteger(result.maintain)).toBe(true);
      expect(Number.isInteger(result.mid)).toBe(true);
      expect(Number.isInteger(result.loss)).toBe(true);
      expect(Number.isInteger(result.extreme)).toBe(true);
    });
  });
});
