import { SurveySession } from './measurement';
import { AppSettings } from './settings';

/**
 * CSV export formátum
 */
export interface CSVExportData {
  Fafaj: string;
  'Átmérő (cm)': number;
  'Magasság (m)': number;
  'Fatömeg (m³)': number;
  Időpont: string;
}

/**
 * PDF jegyzőkönyv meta adatok
 */
export interface PDFReportData {
  /** Session adatok */
  session: SurveySession;

  /** Felmérő neve (opcionális) */
  surveyorName?: string;

  /** Erdőgazdálkodó neve */
  forestOwner?: string;

  /** EGE kód */
  egeCode?: string;

  /** Községhatár */
  municipality?: string;

  /** Erdőrészlet teljes területe (ha) */
  totalArea?: number;

  /** Fakitermeléssel érintett terület (ha) */
  affectedArea?: number;

  /** Vágásmód */
  harvestMethod?: string;

  /** Egészségi állapot */
  healthCondition?: string;

  /** Átlagos kor (év) */
  averageAge?: number;

  /** Átlagos vastagság (cm) */
  averageDiameter?: number;

  /** Átlagos magasság (m) */
  averageHeight?: number;
}

/**
 * Teljes backup JSON struktúra
 */
export interface BackupData {
  /** Backup verzió (pl. "1.0") */
  version: string;

  /** Backup létrehozás időpontja */
  exportedAt: number;

  /** Összes session */
  sessions: SurveySession[];

  /** App beállítások */
  settings?: AppSettings;
}
