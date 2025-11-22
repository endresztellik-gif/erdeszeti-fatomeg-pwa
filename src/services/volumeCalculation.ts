import { volumeTableService } from './volumeTableService';
import { SpeciesKey } from '@data/volumeTables';
import { CalculationResult } from '@app-types/volumeTable';

/**
 * Fatömeg számítás
 * @param species - Fafaj kulcs
 * @param diameterCm - Mellmagassági átmérő (cm)
 * @param heightM - Magasság (m)
 * @returns Számítási eredmény (fatömeg, tartomány info, figyelmeztetések)
 */
export function calculateVolume(
  species: SpeciesKey,
  diameterCm: number,
  heightM: number
): CalculationResult {
  // Tartomány ellenőrzés
  const isInRange = volumeTableService.isInRange(species, diameterCm, heightM);

  // Fatömeg lookup
  const volumeM3 = volumeTableService.lookupVolume(species, diameterCm, heightM);

  // Hiba: nincs találat
  if (volumeM3 === null) {
    return {
      volumeM3: 0,
      isInRange: false,
      warning:
        'A megadott értékek túl messze vannak a táblázat tartományától. Egyedi fatömegbecslés szükséges!',
    };
  }

  // Figyelmeztetés: tartományon kívül, de van érték
  if (!isInRange) {
    return {
      volumeM3,
      isInRange: false,
      warning:
        'Figyelem! Az érték a táblázat tartományán kívül esik. Az eredmény becsült. Egyedi fatömegbecslés ajánlott!',
    };
  }

  // OK: tartományon belül
  return {
    volumeM3,
    isInRange: true,
  };
}

/**
 * Batch számítás (több fa egyszerre)
 */
export function calculateBatchVolume(
  measurements: Array<{
    species: SpeciesKey;
    diameterCm: number;
    heightM: number;
  }>
): CalculationResult[] {
  return measurements.map((m) =>
    calculateVolume(m.species, m.diameterCm, m.heightM)
  );
}
