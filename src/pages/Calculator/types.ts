import type { ReactNode } from 'react';

export interface ICalculatorForm {
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  activity: number;
}

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

export interface CalculatorFormProps {
  values: ICalculatorForm;
  onChange: <K extends keyof ICalculatorForm>(
    field: K,
    value: ICalculatorForm[K],
  ) => void;
}

export interface ResultsProps {
  result: ICalculateResult;
}

export interface ResultRowProps {
  title: string;
  calories: number;
  deficit: number;
  color: 'emerald' | 'yellow' | 'orange' | 'red';
  icon: ReactNode;
}
