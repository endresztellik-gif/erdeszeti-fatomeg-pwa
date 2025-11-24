import { volumeTables, SpeciesKey } from '@data/volumeTables';
import { VolumeTable } from '@app-types/volumeTable';

/**
 * Fatömegtábla szolgáltatás
 * Felelős a fatömegtáblák betöltéséért és lookup műveletekért
 */
export class VolumeTableService {
  private tables: Map<string, VolumeTable> = new Map();

  /**
   * Táblázat betöltése (lazy loading)
   * DEPRECATED: Használd inkább a képlet alapú számítást
   */
  private loadTable(species: SpeciesKey): VolumeTable {
    if (!this.tables.has(species)) {
      this.tables.set(species, volumeTables[species as keyof typeof volumeTables]);
    }
    return this.tables.get(species)!;
  }

  /**
   * Fatömeg keresése a táblázatban
   * Legközelebbi értéket adja vissza (nincs interpoláció)
   */
  lookupVolume(
    species: SpeciesKey,
    diameterCm: number,
    heightM: number
  ): number | null {
    const table = this.loadTable(species);

    // Legközelebbi átmérő keresése
    const nearestDiameter = this.findNearest(table.diameters, diameterCm);

    // Legközelebbi magasság keresése
    const nearestHeight = this.findNearest(table.heights, heightM);

    // Lookup a táblázatban
    const diameterKey = nearestDiameter.toString();
    const heightKey = nearestHeight.toString();

    return table.values[diameterKey]?.[heightKey] || null;
  }

  /**
   * Legközelebbi érték keresése tömbben
   */
  private findNearest(array: number[], target: number): number {
    return array.reduce((prev, curr) =>
      Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
    );
  }

  /**
   * Ellenőrzi, hogy az értékek a táblázat tartományán belül vannak-e
   */
  isInRange(
    species: SpeciesKey,
    diameterCm: number,
    heightM: number
  ): boolean {
    const table = this.loadTable(species);
    const minD = Math.min(...table.diameters);
    const maxD = Math.max(...table.diameters);
    const minH = Math.min(...table.heights);
    const maxH = Math.max(...table.heights);

    return (
      diameterCm >= minD &&
      diameterCm <= maxD &&
      heightM >= minH &&
      heightM <= maxH
    );
  }

  /**
   * Elérhető átmérők listája
   */
  getDiameters(species: SpeciesKey): number[] {
    return this.loadTable(species).diameters;
  }

  /**
   * Elérhető magasságok listája
   */
  getHeights(species: SpeciesKey): number[] {
    return this.loadTable(species).heights;
  }
}

// Singleton instance export
export const volumeTableService = new VolumeTableService();
