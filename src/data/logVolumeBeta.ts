/**
 * Rönkköbözés béta (sudarlóssági) értékek
 * A Huber-Smalian formula számításához
 *
 * Forrás: Erdészeti fatömegtáblázat
 */

export interface BetaValues {
  small: number; // 12-30 cm átmérő
  medium: number; // 32-50 cm átmérő
  large: number; // 52+ cm átmérő
}

export type BetaGroupKey =
  | 'oak'
  | 'turkeyOak'
  | 'beech'
  | 'hornbeam'
  | 'blackLocust'
  | 'hardwood'
  | 'poplar'
  | 'willow'
  | 'softwood'
  | 'conifer';

/**
 * Béta értékek fafajcsoportonként
 * Átmérő tartományok: 12-30 cm, 32-50 cm, 52+ cm
 */
export const logVolumeBetaGroups: Record<BetaGroupKey, BetaValues> = {
  // Tölgyek (Kocsányos, Kocsánytalan, Vörös tölgy) - KST, SZT, KTT, VT
  oak: { small: 0.832808, medium: 1.115149, large: 1.344139 },

  // Cser (Csertölgy) - CS
  turkeyOak: { small: 0.87481, medium: 1.315718, large: 1.403625 },

  // Bükk - B
  beech: { small: 0.944805, medium: 1.064244, large: 1.745519 },

  // Gyertyán - GY
  hornbeam: { small: 0.837588, medium: 1.175978, large: 1.489784 },

  // Akác - A
  blackLocust: { small: 1.019575, medium: 1.834808, large: 1.89375 },

  // Keménylombos egyéb (Juhar, Kőris, Szil, Dió) - J, SZ, K, FD
  hardwood: { small: 0.837588, medium: 1.175978, large: 1.489784 },

  // Nyárak - KONY, KENY, stb.
  poplar: { small: 0.970457, medium: 1.373216, large: 1.949494 },

  // Fűz - FFÜ
  willow: { small: 0.970457, medium: 1.373216, large: 1.949494 },

  // Lágylombos (Éger, Hárs, Nyír) - ME, KH, EH, NY
  softwood: { small: 0.868259, medium: 1.148209, large: 1.321606 },

  // Fenyők (Erdei, Fekete, Luc, Vörös, Duglász) - EF, FF, LF, VF, DF
  conifer: { small: 0.903642, medium: 1.422158, large: 1.944522 },
};

/**
 * Fafaj kulcs -> béta csoport mapping
 * Minden fafajt a megfelelő béta csoporthoz rendel
 */
export const speciesToBetaGroup: Record<string, BetaGroupKey> = {
  // Tölgyek -> oak
  pedunculateOak: 'oak',
  sessileOak: 'oak',
  redOak: 'oak',

  // Cser -> turkeyOak
  turkeyOak: 'turkeyOak',

  // Bükk -> beech
  beech: 'beech',

  // Gyertyán -> hornbeam
  hornbeam: 'hornbeam',

  // Akác -> blackLocust
  blackLocust: 'blackLocust',

  // Keménylombosok -> hardwood
  maple: 'hardwood',
  ash: 'hardwood',
  blackWalnut: 'hardwood',

  // Nyárak -> poplar
  whitePoplar: 'poplar',
  blackPoplar: 'poplar',
  aspen: 'poplar',
  agathePoplar: 'poplar',
  i214Poplar: 'poplar',
  latePoplar: 'poplar',
  earlyPoplar: 'poplar',
  giantPoplar: 'poplar',

  // Fűz -> willow
  whiteWillow: 'willow',

  // Lágylombosok -> softwood
  alder: 'softwood',
  linden: 'softwood',
  silverBirch: 'softwood',

  // Fenyők -> conifer
  scotsPine: 'conifer',
  austrianPine: 'conifer',
  spruce: 'conifer',
  silverFir: 'conifer',
  douglasFir: 'conifer',
  larch: 'conifer',
};

/**
 * Béta érték lekérdezése fafaj és átmérő alapján
 * @param speciesKey Fafaj kulcs (pl. 'beech', 'pedunculateOak')
 * @param diameterCm Csúcsátmérő cm-ben
 * @returns Béta érték a Huber-Smalian formulához
 */
export function getBetaValue(speciesKey: string, diameterCm: number): number {
  const group = speciesToBetaGroup[speciesKey] || 'hardwood';
  const betas = logVolumeBetaGroups[group];

  if (diameterCm <= 30) return betas.small;
  if (diameterCm <= 50) return betas.medium;
  return betas.large;
}

/**
 * Béta csoport magyar neve
 */
export const betaGroupNames: Record<BetaGroupKey, string> = {
  oak: 'Tölgyek',
  turkeyOak: 'Cser',
  beech: 'Bükk',
  hornbeam: 'Gyertyán',
  blackLocust: 'Akác',
  hardwood: 'Keménylombos egyéb',
  poplar: 'Nyárak',
  willow: 'Fűz',
  softwood: 'Lágylombos',
  conifer: 'Fenyők',
};
