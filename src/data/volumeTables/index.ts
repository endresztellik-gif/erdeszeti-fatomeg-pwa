import beechData from './beech.json';
import { VolumeTable } from '@app-types/volumeTable';

// Típusos import
export const beech: VolumeTable = beechData as VolumeTable;

// Központi export object
export const volumeTables = {
  beech,
  // További fafajok később hozzáadhatók:
  // sessileOak,
  // pedunculateOak,
  // turkeyOak,
  // acacia,
  // scotsPine,
  // blackPine,
  // spruce,
  // redPine,
  // whitePoplar,
  // blackPoplar,
};

// Fafaj kulcsok típusa
export type SpeciesKey = keyof typeof volumeTables;

// Fafajok listája (dropdown-hoz)
export const speciesList = [
  { key: 'beech', name: 'Bükk', code: 'B' },
  // További fafajok később hozzáadhatók
] as const;
