import { BMR_CONSTANTS, CALORIE_DEFICITS } from '../../../constants/storage';
import { type ICalculatorForm } from '../types/form';

export interface ICalculateResult {
  maintain: number;
  maintainPercent: number;
  mid: number;
  midPercent: number;
  loss: number;
  lossPercent: number;
  extreme: number;
  extremePercent: number;
}

export const calculate = (data: ICalculatorForm): ICalculateResult => {
  const W = BMR_CONSTANTS.WEIGHT_MULTIPLIER * data.weight;
  const H = BMR_CONSTANTS.HEIGHT_MULTIPLIER * data.height;
  const A = BMR_CONSTANTS.AGE_MULTIPLIER * data.age;
  const genderFactor =
    data.gender === 'male'
      ? BMR_CONSTANTS.MALE_FACTOR
      : BMR_CONSTANTS.FEMALE_FACTOR;

  const bmr = W + H - A + genderFactor;
  const maintain = Math.round(bmr * data.activity);

  const mid = maintain - CALORIE_DEFICITS.MILD;
  const loss = maintain - CALORIE_DEFICITS.MODERATE;
  const extreme = maintain - CALORIE_DEFICITS.EXTREME;

  return {
    maintain,
    maintainPercent: 100,
    mid,
    midPercent: Math.round((mid / maintain) * 100),
    loss,
    lossPercent: Math.round((loss / maintain) * 100),
    extreme,
    extremePercent: Math.round((extreme / maintain) * 100),
  };
};
