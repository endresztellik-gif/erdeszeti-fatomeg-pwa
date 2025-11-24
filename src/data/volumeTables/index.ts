/**
 * DEPRECATED: Ez a modul elavult.
 * Használd helyette: @data/volumeFormulas
 *
 * A fatérfogat számítás most képlet alapú, nem táblázat alapú.
 */

import beechData from './beech.json';
import sessileOakData from './sessileOak.json';
import pedunculateOakData from './pedunculateOak.json';
import blackLocustData from './blackLocust.json';
import spruceData from './spruce.json';
import { VolumeTable } from '@app-types/volumeTable';

// Típusos import (backwards compatibility)
export const beech: VolumeTable = beechData as VolumeTable;
export const sessileOak: VolumeTable = sessileOakData as VolumeTable;
export const pedunculateOak: VolumeTable = pedunculateOakData as VolumeTable;
export const blackLocust: VolumeTable = blackLocustData as VolumeTable;
export const spruce: VolumeTable = spruceData as VolumeTable;

// Központi export object (backwards compatibility)
export const volumeTables = {
  beech,
  sessileOak,
  pedunculateOak,
  blackLocust,
  spruce,
};

// Re-export az új modulból
export { volumeFormulas, speciesList, type SpeciesKey } from '../volumeFormulas';

// Régi típus (backwards compatibility)
export type OldSpeciesKey = keyof typeof volumeTables;
