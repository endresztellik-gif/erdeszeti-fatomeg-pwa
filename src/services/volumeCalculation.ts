import { volumeFormulas, SpeciesKey } from '@data/volumeFormulas';
import { CalculationResult } from '@app-types/volumeTable';

/**
 * Fatérfogat számítás képlettel
 *
 * Képlet: v = p1 × (h × d)^p2 × d^p3 × h^p4 × k
 *
 * Forrás: https://erdoleltar.nfk.gov.hu/mintafak_faterfogatanak_szamitasa
 *
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
  const params = volumeFormulas[species];

  if (!params) {
    return {
      volumeM3: 0,
      isInRange: false,
      warning: `Ismeretlen fafaj: ${species}`,
    };
  }

  // Tartomány ellenőrzés
  const isInRange = checkRange(params, diameterCm, heightM);

  // Fatérfogat számítás képlettel
  // v = (p1 + p2*d*h + p3*d + p4*h) × (h/(h-1.3))^k × (d²*h) / 10^8
  const { p1, p2, p3, p4, k } = params;
  const d = diameterCm;
  const h = heightM;

  // Első tag: lineáris kifejezés
  const term1 = p1 + p2 * d * h + p3 * d + p4 * h;

  // Második tag: magasság korrekció
  const term2 = Math.pow(h / (h - 1.3), k);

  // Harmadik tag: alapvető térfogat komponens
  const term3 = (d * d * h) / Math.pow(10, 8);

  const volumeM3 = term1 * term2 * term3;

  // Ellenőrzés: érvénytelen eredmény
  if (!isFinite(volumeM3) || volumeM3 < 0 || isNaN(volumeM3)) {
    return {
      volumeM3: 0,
      isInRange: false,
      warning: 'A számítás érvénytelen eredményt adott. Ellenőrizd az értékeket!',
    };
  }

  // Figyelmeztetés: tartományon kívül
  if (!isInRange) {
    return {
      volumeM3,
      isInRange: false,
      warning: `Figyelem! Az átmérő (${diameterCm} cm) vagy magasság (${heightM} m) a javasolt tartományon kívül esik. Az eredmény pontatlan lehet!`,
    };
  }

  // OK: tartományon belül
  return {
    volumeM3,
    isInRange: true,
  };
}

/**
 * Tartomány ellenőrzés
 */
function checkRange(
  params: (typeof volumeFormulas)[SpeciesKey],
  diameterCm: number,
  heightM: number
): boolean {
  const diameterOk =
    diameterCm >= params.minDiameter &&
    (params.maxDiameter === null || diameterCm <= params.maxDiameter);

  const heightOk =
    heightM >= params.minHeight &&
    (params.maxHeight === null || heightM <= params.maxHeight);

  return diameterOk && heightOk;
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
