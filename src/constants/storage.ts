export const STORAGE_KEYS = {
  CHAT_MESSAGES: 'chatMessages',
  USER_SETTINGS: 'userSettings',
} as const;

export const CALCULATOR_DEFAULTS = {
  AGE: 30,
  HEIGHT: 175,
  WEIGHT: 75,
  ACTIVITY: 1.725,
} as const;

export const BMR_CONSTANTS = {
  WEIGHT_MULTIPLIER: 10,
  HEIGHT_MULTIPLIER: 6.25,
  AGE_MULTIPLIER: 5,
  MALE_FACTOR: 5,
  FEMALE_FACTOR: -161,
} as const;

export const CALORIE_DEFICITS = {
  MILD: 250,
  MODERATE: 500,
  EXTREME: 1000,
} as const;

export const CHAT_ROLES = {
  MODEL: 'model',
  USER: 'user',
} as const;
