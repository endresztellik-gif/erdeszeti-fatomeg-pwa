import { v4 as uuidv4 } from 'uuid';
import { db } from '@db/database';
import { SurveySession, TreeMeasurement } from '@app-types/measurement';
import { calculateVolume } from './volumeCalculation';
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
