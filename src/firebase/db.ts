import { connectDatabaseEmulator, getDatabase } from 'firebase/database';

import { app, useEmulators } from './config';

export const database = getDatabase(app);

if (useEmulators) {
  connectDatabaseEmulator(database, '127.0.0.1', 9000);
}
