import { v4 as uuidv4 } from 'uuid';
import { db } from '@db/database';
import {
  SurveySession,
  TreeMeasurement,
  LogSession,
  LogMeasurement,
} from '@app-types/measurement';
import { calculateVolume } from './volumeCalculation';
import { calculateLogVolume } from './logVolumeCalculation';
import { SpeciesKey } from '@data/volumeTables';

/**
 * Survey szolgáltatás
 * Felelős a session CRUD műveletekért és mérések kezeléséért
 */
export class SurveyService {
  /**
   * Új session létrehozása
   */
  async createSession(type: 'standing' | 'harvested'): Promise<SurveySession> {
    const session: SurveySession = {
      id: uuidv4(),
      type,
      startedAt: Date.now(),
      trees: [],
      heightMode: 'perTree',
      isPaused: false,
    };

    await db.sessions.add(session);
    return session;
  }

  /**
   * Session lekérdezése ID alapján
   */
  async getSession(id: string): Promise<SurveySession | undefined> {
    return await db.sessions.get(id);
  }

  /**
   * Összes session lekérdezése (időrendben, legújabb elől)
   */
  async getAllSessions(): Promise<SurveySession[]> {
    return await db.sessions.orderBy('startedAt').reverse().toArray();
  }

  /**
   * Aktív (folyamatban lévő) sessionök lekérdezése
   */
  async getActiveSessions(): Promise<SurveySession[]> {
    return await db.sessions.filter((s) => !s.endedAt).toArray();
  }

  /**
   * Mérés hozzáadása session-höz
   */
  async addMeasurement(
    sessionId: string,
    species: SpeciesKey,
    diameterCm: number,
    heightM: number
  ): Promise<TreeMeasurement> {
    const { volumeM3 } = calculateVolume(species, diameterCm, heightM);

    const measurement: TreeMeasurement = {
      id: uuidv4(),
      species,
      diameterCm,
      heightM,
      volumeM3,
      timestamp: Date.now(),
    };

    // Session frissítése
    const session = await this.getSession(sessionId);
    if (session) {
      session.trees.push(measurement);
      await db.sessions.put(session);
    }

    return measurement;
  }

  /**
   * Session szüneteltetése
   */
  async pauseSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.isPaused = true;
      await db.sessions.put(session);
    }
  }

  /**
   * Session folytatása
   */
  async resumeSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.isPaused = false;
      await db.sessions.put(session);
    }
  }

  /**
   * Session befejezése
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.endedAt = Date.now();
      session.isPaused = false;
      await db.sessions.put(session);
    }
  }

  /**
   * Session törlése
   */
  async deleteSession(sessionId: string): Promise<void> {
    await db.sessions.delete(sessionId);
  }

  /**
   * Utolsó mérés visszavonása (undo)
   */
  async undoLastMeasurement(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session && session.trees.length > 0) {
      session.trees.pop();
      await db.sessions.put(session);
    }
  }

  /**
   * Átlagmagasság beállítása fafajra
   */
  async setAverageHeight(
    sessionId: string,
    species: string,
    heightM: number
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      if (!session.averageHeights) {
        session.averageHeights = {};
      }
      session.averageHeights[species] = heightM;
      await db.sessions.put(session);
    }
  }

  /**
   * Magasság mód váltása
   */
  async setHeightMode(
    sessionId: string,
    mode: 'average' | 'perTree'
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.heightMode = mode;
      await db.sessions.put(session);
    }
  }

  /**
   * Session részleges frissítése
   */
  async updateSession(
    sessionId: string,
    updates: Partial<Omit<SurveySession, 'id' | 'startedAt'>>
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      Object.assign(session, updates);
      await db.sessions.put(session);
    }
  }
}

// Singleton instance export
export const surveyService = new SurveyService();

// ============================================================
// RÖNKKÖBÖZÉS SERVICE
// ============================================================

/**
 * Log Survey szolgáltatás
 * Rönkköbözés session CRUD műveletekért és mérések kezeléséért
 */
export class LogSurveyService {
  /**
   * Új log session létrehozása
   */
  async createSession(
    defaultSpecies?: string,
    defaultLengthM?: number
  ): Promise<LogSession> {
    const session: LogSession = {
      id: uuidv4(),
      type: 'log',
      startedAt: Date.now(),
      logs: [],
      isPaused: false,
      defaultSpecies,
      defaultLengthM,
    };

    await db.logSessions.add(session);
    return session;
  }

  /**
   * Log session lekérdezése ID alapján
   */
  async getSession(id: string): Promise<LogSession | undefined> {
    return await db.logSessions.get(id);
  }

  /**
   * Összes log session lekérdezése (időrendben, legújabb elől)
   */
  async getAllSessions(): Promise<LogSession[]> {
    return await db.logSessions.orderBy('startedAt').reverse().toArray();
  }

  /**
   * Aktív (folyamatban lévő) log sessionök lekérdezése
   */
  async getActiveSessions(): Promise<LogSession[]> {
    return await db.logSessions.filter((s) => !s.endedAt).toArray();
  }

  /**
   * Rönk mérés hozzáadása session-höz
   */
  async addMeasurement(
    sessionId: string,
    species: string,
    tipDiameterCm: number,
    lengthM: number
  ): Promise<LogMeasurement> {
    const result = calculateLogVolume(species, tipDiameterCm, lengthM);

    const measurement: LogMeasurement = {
      id: uuidv4(),
      species,
      tipDiameterCm,
      lengthM,
      volumeM3: result.volumeM3,
      betaValue: result.betaValue,
      timestamp: Date.now(),
    };

    // Session frissítése
    const session = await this.getSession(sessionId);
    if (session) {
      session.logs.push(measurement);
      await db.logSessions.put(session);
    }

    return measurement;
  }

  /**
   * Log session szüneteltetése
   */
  async pauseSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.isPaused = true;
      await db.logSessions.put(session);
    }
  }

  /**
   * Log session folytatása
   */
  async resumeSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.isPaused = false;
      await db.logSessions.put(session);
    }
  }

  /**
   * Log session befejezése
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.endedAt = Date.now();
      session.isPaused = false;
      await db.logSessions.put(session);
    }
  }

  /**
   * Log session törlése
   */
  async deleteSession(sessionId: string): Promise<void> {
    await db.logSessions.delete(sessionId);
  }

  /**
   * Utolsó rönk mérés visszavonása (undo)
   */
  async undoLastMeasurement(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session && session.logs.length > 0) {
      session.logs.pop();
      await db.logSessions.put(session);
    }
  }

  /**
   * Alapértelmezett fafaj beállítása
   */
  async setDefaultSpecies(sessionId: string, species: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.defaultSpecies = species;
      await db.logSessions.put(session);
    }
  }

  /**
   * Alapértelmezett hossz beállítása
   */
  async setDefaultLength(sessionId: string, lengthM: number): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.defaultLengthM = lengthM;
      await db.logSessions.put(session);
    }
  }

  /**
   * Log session részleges frissítése
   */
  async updateSession(
    sessionId: string,
    updates: Partial<Omit<LogSession, 'id' | 'startedAt'>>
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      Object.assign(session, updates);
      await db.logSessions.put(session);
    }
  }
}

// Singleton instance export
export const logSurveyService = new LogSurveyService();
