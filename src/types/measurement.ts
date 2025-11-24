/**
 * Egy egyedi fa mérésének adatai
 */
export interface TreeMeasurement {
  /** Egyedi azonosító (UUID v4) */
  id: string;

  /** Fafaj neve (pl. "Bükk", "Kocsányos tölgy") */
  species: string;

  /** Mellmagassági átmérő centiméterben */
  diameterCm: number;

  /** Magasság méterben */
  heightM: number;

  /** Kiszámított fatömeg köbméterben (m³) */
  volumeM3: number;

  /** Mérés időpontja (Unix timestamp millisecond) */
  timestamp: number;
}

/**
 * Egy teljes mérési session adatai
 */
export interface SurveySession {
  /** Egyedi azonosító (UUID v4) */
  id: string;

  /** Mérés típusa */
  type: 'standing' | 'harvested';

  /** Session kezdés időpontja (Unix timestamp ms) */
  startedAt: number;

  /** Session befejezés időpontja (Unix timestamp ms, opcionális) */
  endedAt?: number;

  /** Mért fák listája */
  trees: TreeMeasurement[];

  /** Magasság megadási mód */
  heightMode: 'average' | 'perTree';

  /** Átlagmagasságok fafajonként (ha heightMode === 'average') */
  averageHeights?: Record<string, number>;

  /** Session jelenleg szüneteltetve van? */
  isPaused: boolean;

  /** Helyszín (opcionális, pl. "Erdőrészlet 42A") */
  location?: string;

  /** Helyszín részletes adatok */
  locationData?: {
    type: 'erdoreszlet' | 'helyrajzi';
    kozseg?: string;
    erdotag?: string;
    erdoreszlet?: string;
    helyrajziSzam?: string;
  };

  /** GPS koordináták (opcionális, jövőbeli funkció) */
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };

  /** Megjegyzések (opcionális) */
  notes?: string;
}

/**
 * Session összegzés statisztikák
 */
export interface SessionSummary {
  /** Összes fa száma */
  totalTrees: number;

  /** Összes fatömeg (m³) */
  totalVolume: number;

  /** Fafajonkénti bontás */
  bySpecies: Record<string, {
    count: number;
    volume: number;
    avgDiameter: number;
    avgHeight: number;
  }>;

  /** Session időtartama (ms) */
  duration: number;

  /** Átlagos mérési idő (ms/fa) */
  avgMeasurementTime: number;
}

/**
 * Partial frissítések
 */
export type PartialSurveySession = Partial<Omit<SurveySession, 'id' | 'startedAt'>>;

/**
 * Csak olvasható mérés
 */
export type ReadonlyTreeMeasurement = Readonly<TreeMeasurement>;

/**
 * Session meta adatok (fák nélkül)
 */
export type SessionMetadata = Omit<SurveySession, 'trees'>;
