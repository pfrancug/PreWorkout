import type {
  ICalculateResult,
  ICalculatorForm,
} from '@pages/Calculator/types';

import { BMR_CONSTANTS, CALORIE_DEFICITS } from '@constants/storage';

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
