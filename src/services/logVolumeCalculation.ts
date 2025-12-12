/**
 * Rönk térfogat számítás - Huber-Smalian formula
 *
 * Formula: V = ((d²π/4) + ((d + L×β)²π/4)) / 2 × L
 *
 * Ahol:
 * - V = köbtartalom (m³)
 * - L = hosszúság (m)
 * - d = csúcsátmérő (m)
 * - β = sudarlóssági érték
 */

import { getBetaValue, speciesToBetaGroup } from '@data/logVolumeBeta';

export interface LogVolumeResult {
  volumeM3: number;
  betaValue: number;
  tipDiameterM: number;
  baseDiameterM: number;
}

/**
 * Rönk térfogatának számítása Huber-Smalian formulával
 * @param speciesKey Fafaj kulcs (pl. 'beech', 'pedunculateOak')
 * @param tipDiameterCm Csúcsátmérő cm-ben (12-100 cm)
 * @param lengthM Rönk hossza méterben (1-6.6 m)
 * @returns Térfogat m³-ben és részletek
 */
export function calculateLogVolume(
  speciesKey: string,
  tipDiameterCm: number,
  lengthM: number
): LogVolumeResult {
  // Béta érték lekérdezése
  const beta = getBetaValue(speciesKey, tipDiameterCm);

  // Átmérő átváltása méterre
  const d = tipDiameterCm / 100;
  const L = lengthM;

  // Tő átmérő számítása (d2 = d + L × β)
  // β cm/m egységben van, ezért d marad cm-ben a számításhoz
  const d2Cm = tipDiameterCm + lengthM * beta;
  const d2 = d2Cm / 100;

  // Huber-Smalian formula
  // V = ((d₁²π/4) + (d₂²π/4)) / 2 × L
  const area1 = (d * d * Math.PI) / 4; // Csúcs keresztmetszet
  const area2 = (d2 * d2 * Math.PI) / 4; // Tő keresztmetszet
  const V = ((area1 + area2) / 2) * L;

  return {
    volumeM3: Math.round(V * 10000) / 10000, // 4 tizedesjegy pontosság
    betaValue: beta,
    tipDiameterM: d,
    baseDiameterM: d2,
  };
}

/**
 * Egyszerűsített térfogat számítás - csak m³ érték
 */
export function calculateLogVolumeSimple(
  speciesKey: string,
  tipDiameterCm: number,
  lengthM: number
): number {
  return calculateLogVolume(speciesKey, tipDiameterCm, lengthM).volumeM3;
}

/**
 * Átmérő validálása
 * @param diameterCm Átmérő cm-ben
 * @returns true ha érvényes (12-100 cm, páros szám)
 */
export function validateDiameter(diameterCm: number): boolean {
  return diameterCm >= 12 && diameterCm <= 100 && diameterCm % 2 === 0;
}

/**
 * Hosszúság validálása
 * @param lengthM Hossz méterben
 * @returns true ha érvényes (1-6.6 m)
 */
export function validateLength(lengthM: number): boolean {
  return lengthM >= 1 && lengthM <= 6.6;
}

/**
 * Átmérő kerekítése legközelebbi páros számra
 * @param diameterCm Nyers átmérő
 * @returns Kerekített páros átmérő (12-100 közötti)
 */
export function roundToEvenDiameter(diameterCm: number): number {
  // Kerekítés legközelebbi páros számra
  let rounded = Math.round(diameterCm / 2) * 2;

  // Tartomány korlátozás
  if (rounded < 12) rounded = 12;
  if (rounded > 100) rounded = 100;

  return rounded;
}

/**
 * Fafaj ellenőrzése - van-e béta értéke
 */
export function hasSpeciesBetaValue(speciesKey: string): boolean {
  return speciesKey in speciesToBetaGroup;
}

/**
 * Összes elérhető fafaj a rönkköbözéshez
 */
export function getAvailableLogSpecies(): string[] {
  return Object.keys(speciesToBetaGroup);
}

/**
 * Béta csoport lekérdezése fafaj alapján
 */
export function getSpeciesBetaGroup(speciesKey: string): string | null {
  return speciesToBetaGroup[speciesKey] || null;
}
