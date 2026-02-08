import admin from './admin.json';
import auth from './auth.json';
import calculator from './calculator.json';
import calendar from './calendar.json';
import chat from './chat.json';
import common from './common.json';
import dashboard from './dashboard.json';
import diary from './diary.json';
import legal from './legal.json';
import settings from './settings.json';

export const en = {
  ...common,
  ...admin,
  ...auth,
  ...dashboard,
  ...diary,
  ...calendar,
  ...chat,
  ...calculator,
  ...settings,
  ...legal,
};
