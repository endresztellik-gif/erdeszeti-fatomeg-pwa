import Dexie, { Table } from 'dexie';
import { SurveySession, TreeMeasurement } from '@app-types/measurement';

/**
 * Erdészeti Fatömegbecslő alkalmazás adatbázis
 */
export class AppDatabase extends Dexie {
  // Táblák típusdefiníciója
  sessions!: Table<SurveySession, string>;
  measurements!: Table<TreeMeasurement, string>;

  constructor() {
    super('erdeszeti-fatomeg-db');

    // Verzió 1: Alapvető schema
    this.version(1).stores({
      sessions: 'id, type, startedAt, endedAt, isPaused',
      measurements: 'id, timestamp, species',
    });
  }
}

// Singleton instance export
export const db = new AppDatabase();
