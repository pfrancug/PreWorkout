import { BMR_CONSTANTS, CALORIE_DEFICITS } from '../../../constants/storage';
import { type ICalculatorForm } from '../types/form';

export interface ICalculateResult {
  bmr: number;
  maintain: number;
  mid: number;
  midDeficit: number;
  loss: number;
  lossDeficit: number;
  extreme: number;
  extremeDeficit: number;
}

export const calculate = (data: ICalculatorForm): ICalculateResult => {
  const W = BMR_CONSTANTS.WEIGHT_MULTIPLIER * data.weight;
  const H = BMR_CONSTANTS.HEIGHT_MULTIPLIER * data.height;
  const A = BMR_CONSTANTS.AGE_MULTIPLIER * data.age;
  const genderFactor =
    data.gender === 'male'
      ? BMR_CONSTANTS.MALE_FACTOR
      : BMR_CONSTANTS.FEMALE_FACTOR;

  const bmr = Math.round(W + H - A + genderFactor);
  const maintain = Math.round(bmr * data.activity);

  return {
    bmr,
    maintain,
    mid: maintain - CALORIE_DEFICITS.MILD,
    midDeficit: CALORIE_DEFICITS.MILD,
    loss: maintain - CALORIE_DEFICITS.MODERATE,
    lossDeficit: CALORIE_DEFICITS.MODERATE,
    extreme: maintain - CALORIE_DEFICITS.EXTREME,
    extremeDeficit: CALORIE_DEFICITS.EXTREME,
  };
};
