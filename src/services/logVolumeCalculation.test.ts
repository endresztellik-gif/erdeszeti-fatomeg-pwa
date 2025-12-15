import { describe, it, expect } from 'vitest';
import {
  calculateLogVolume,
  calculateLogVolumeSimple,
  validateDiameter,
  validateLength,
  roundToEvenDiameter,
  hasSpeciesBetaValue,
  getAvailableLogSpecies,
  getSpeciesBetaGroup,
} from './logVolumeCalculation';

/**
 * Unit tesztek: Rönk térfogat számítás (Huber-Smalian formula)
 *
 * Tesztelt funkciók:
 * - Huber-Smalian formula pontossága
 * - Béta érték helyes kiválasztása (átmérő tartomány szerint)
 * - Validációk (átmérő, hossz)
 * - Átmérő kerekítés páros számra
 * - Fafaj béta mapping
 * - Edge case-ek
 */

describe('logVolumeCalculation - Rönkköbözés', () => {
  // ========================================
  // HUBER-SMALIAN FORMULA
  // ========================================

  describe('calculateLogVolume - Alapvető számítások', () => {
    it('bükk (beech) - közepes átmérő (32-50 cm)', () => {
      // Bükk, 40 cm csúcsátmérő, 4 m hosszú
      // Béta (medium): 1.064244 cm/m (valós érték!)
      const result = calculateLogVolume('beech', 40, 4);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.betaValue).toBeCloseTo(1.064244, 4);
      expect(result.tipDiameterM).toBe(0.4);

      // Tő átmérő: 40 + 4×1.064244 = 44.256976 cm = 0.44256976 m
      expect(result.baseDiameterM).toBeCloseTo(0.442570, 3);

      // Térfogat reasonableness: 40cm × 4m -> kb 0.5-0.7 m³
      expect(result.volumeM3).toBeGreaterThan(0.4);
      expect(result.volumeM3).toBeLessThan(0.8);
    });

    it('bükk - kis átmérő (12-30 cm)', () => {
      // Bükk, 20 cm, 3 m
      // Béta (small): 0.944805 cm/m (valós érték!)
      const result = calculateLogVolume('beech', 20, 3);

      expect(result.betaValue).toBeCloseTo(0.944805, 4);
      expect(result.volumeM3).toBeGreaterThan(0);

      // Tő: 20 + 3×0.944805 = 22.834415 cm
      expect(result.baseDiameterM).toBeCloseTo(0.228344, 3);

      // Térfogat: kb 0.1-0.2 m³
      expect(result.volumeM3).toBeGreaterThan(0.05);
      expect(result.volumeM3).toBeLessThan(0.3);
    });

    it('bükk - nagy átmérő (52+ cm)', () => {
      // Bükk, 60 cm, 5 m
      // Béta (large): 1.745519 cm/m (valós érték!)
      const result = calculateLogVolume('beech', 60, 5);

      expect(result.betaValue).toBeCloseTo(1.745519, 4);
      expect(result.volumeM3).toBeGreaterThan(0);

      // Tő: 60 + 5×1.745519 = 68.727595 cm
      expect(result.baseDiameterM).toBeCloseTo(0.687276, 3);

      // Térfogat: kb 1.3-1.7 m³
      expect(result.volumeM3).toBeGreaterThan(1.0);
      expect(result.volumeM3).toBeLessThan(2.0);
    });

    it('kocsányos tölgy (pedunculateOak) - közepes', () => {
      const result = calculateLogVolume('pedunculateOak', 40, 4);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.betaValue).toBeGreaterThan(0);
      expect(result.tipDiameterM).toBe(0.4);
    });

    it('akác (blackLocust) - közepes', () => {
      const result = calculateLogVolume('blackLocust', 36, 3.5);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.betaValue).toBeGreaterThan(0);
    });

    it('lucfenyő (spruce) - közepes', () => {
      const result = calculateLogVolume('spruce', 30, 4);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.betaValue).toBeGreaterThan(0);
    });
  });

  // ========================================
  // BÉTA ÉRTÉK TARTOMÁNYOK
  // ========================================

  describe('Béta érték tartomány szerinti kiválasztása', () => {
    it('kis átmérő (12 cm) - small béta', () => {
      const result = calculateLogVolume('beech', 12, 3);
      expect(result.betaValue).toBeCloseTo(0.944805, 4); // Bükk small béta
    });

    it('határ kis-közepes (30 cm) - small béta', () => {
      const result = calculateLogVolume('beech', 30, 3);
      expect(result.betaValue).toBeCloseTo(0.944805, 4); // <= 30 -> small
    });

    it('határ közepes-kis (32 cm) - medium béta', () => {
      const result = calculateLogVolume('beech', 32, 3);
      expect(result.betaValue).toBeCloseTo(1.064244, 4); // >= 32 -> medium
    });

    it('határ közepes-nagy (50 cm) - medium béta', () => {
      const result = calculateLogVolume('beech', 50, 3);
      expect(result.betaValue).toBeCloseTo(1.064244, 4); // <= 50 -> medium
    });

    it('határ nagy-közepes (52 cm) - large béta', () => {
      const result = calculateLogVolume('beech', 52, 3);
      expect(result.betaValue).toBeCloseTo(1.745519, 4); // >= 52 -> large
    });

    it('nagy átmérő (100 cm) - large béta', () => {
      const result = calculateLogVolume('beech', 100, 5);
      expect(result.betaValue).toBeCloseTo(1.745519, 4); // Bükk large béta
    });
  });

  // ========================================
  // MATEMATIKAI TULAJDONSÁGOK
  // ========================================

  describe('Huber-Smalian formula tulajdonságok', () => {
    it('monoton növekvő átmérőben (fix hossz)', () => {
      const v1 = calculateLogVolume('beech', 20, 4).volumeM3;
      const v2 = calculateLogVolume('beech', 40, 4).volumeM3;
      const v3 = calculateLogVolume('beech', 60, 4).volumeM3;

      expect(v2).toBeGreaterThan(v1);
      expect(v3).toBeGreaterThan(v2);
    });

    it('monoton növekvő hosszban (fix átmérő)', () => {
      const v1 = calculateLogVolume('beech', 40, 2).volumeM3;
      const v2 = calculateLogVolume('beech', 40, 4).volumeM3;
      const v3 = calculateLogVolume('beech', 40, 6).volumeM3;

      expect(v2).toBeGreaterThan(v1);
      expect(v3).toBeGreaterThan(v2);
    });

    it('lineáris hosszban (fix átmérő, béta)', () => {
      // Ugyanaz a béta tartomány (40 cm -> medium)
      const v1 = calculateLogVolume('beech', 40, 2).volumeM3;
      const v2 = calculateLogVolume('beech', 40, 4).volumeM3;

      // 2× hossz -> ~2× térfogat (nem teljesen lineáris a béta miatt)
      const ratio = v2 / v1;
      expect(ratio).toBeGreaterThan(1.8);
      expect(ratio).toBeLessThan(2.2);
    });

    it('térfogat pontosság - 4 tizedesjegy', () => {
      const result = calculateLogVolume('beech', 40, 4);

      // Ellenőrizd, hogy max 4 tizedesjegy van
      const decimals = result.volumeM3.toString().split('.')[1]?.length || 0;
      expect(decimals).toBeLessThanOrEqual(4);
    });
  });

  // ========================================
  // VALIDÁCIÓK
  // ========================================

  describe('validateDiameter - Átmérő validálás', () => {
    it('érvényes átmérők (páros, 12-100)', () => {
      expect(validateDiameter(12)).toBe(true);
      expect(validateDiameter(20)).toBe(true);
      expect(validateDiameter(40)).toBe(true);
      expect(validateDiameter(60)).toBe(true);
      expect(validateDiameter(100)).toBe(true);
    });

    it('érvénytelen - páratlan szám', () => {
      expect(validateDiameter(13)).toBe(false);
      expect(validateDiameter(21)).toBe(false);
      expect(validateDiameter(39)).toBe(false);
    });

    it('érvénytelen - túl kicsi (<12)', () => {
      expect(validateDiameter(10)).toBe(false);
      expect(validateDiameter(8)).toBe(false);
      expect(validateDiameter(0)).toBe(false);
    });

    it('érvénytelen - túl nagy (>100)', () => {
      expect(validateDiameter(102)).toBe(false);
      expect(validateDiameter(120)).toBe(false);
    });

    it('érvénytelen - negatív', () => {
      expect(validateDiameter(-20)).toBe(false);
    });
  });

  describe('validateLength - Hosszúság validálás', () => {
    it('érvényes hosszúságok (1-6.6 m)', () => {
      expect(validateLength(1)).toBe(true);
      expect(validateLength(3)).toBe(true);
      expect(validateLength(4.5)).toBe(true);
      expect(validateLength(6.6)).toBe(true);
    });

    it('érvénytelen - túl rövid (<1)', () => {
      expect(validateLength(0.5)).toBe(false);
      expect(validateLength(0)).toBe(false);
    });

    it('érvénytelen - túl hosszú (>6.6)', () => {
      expect(validateLength(7)).toBe(false);
      expect(validateLength(10)).toBe(false);
    });

    it('érvénytelen - negatív', () => {
      expect(validateLength(-3)).toBe(false);
    });

    it('határérték - 1 m (minimum)', () => {
      expect(validateLength(1)).toBe(true);
      expect(validateLength(1.0)).toBe(true);
    });

    it('határérték - 6.6 m (maximum)', () => {
      expect(validateLength(6.6)).toBe(true);
    });
  });

  describe('roundToEvenDiameter - Átmérő kerekítés', () => {
    it('páratlan -> páros (felfelé)', () => {
      expect(roundToEvenDiameter(21)).toBe(22);
      expect(roundToEvenDiameter(39)).toBe(40);
      expect(roundToEvenDiameter(51)).toBe(52);
    });

    it('páratlan -> páros (lefelé)', () => {
      expect(roundToEvenDiameter(19)).toBe(20);
      expect(roundToEvenDiameter(37)).toBe(38);
    });

    it('páros -> páros (változatlan)', () => {
      expect(roundToEvenDiameter(20)).toBe(20);
      expect(roundToEvenDiameter(40)).toBe(40);
      expect(roundToEvenDiameter(60)).toBe(60);
    });

    it('alsó korlát (12 cm minimum)', () => {
      expect(roundToEvenDiameter(5)).toBe(12);
      expect(roundToEvenDiameter(10)).toBe(12); // 10 -> 10, majd >= 12 korlát -> 12
      expect(roundToEvenDiameter(11)).toBe(12);
    });

    it('felső korlát (100 cm maximum)', () => {
      expect(roundToEvenDiameter(105)).toBe(100);
      expect(roundToEvenDiameter(120)).toBe(100);
    });

    it('floating point kerekítés', () => {
      expect(roundToEvenDiameter(20.3)).toBe(20);
      expect(roundToEvenDiameter(20.7)).toBe(20); // Közelebb 20-hoz
      expect(roundToEvenDiameter(21.4)).toBe(22);
    });
  });

  // ========================================
  // FAFAJ BÉTA MAPPING
  // ========================================

  describe('Fafaj béta mapping', () => {
    it('hasSpeciesBetaValue - létező fafajok', () => {
      expect(hasSpeciesBetaValue('beech')).toBe(true);
      expect(hasSpeciesBetaValue('pedunculateOak')).toBe(true);
      expect(hasSpeciesBetaValue('blackLocust')).toBe(true);
      expect(hasSpeciesBetaValue('spruce')).toBe(true);
    });

    it('hasSpeciesBetaValue - nem létező fafaj', () => {
      expect(hasSpeciesBetaValue('unknown')).toBe(false);
      expect(hasSpeciesBetaValue('')).toBe(false);
    });

    it('getAvailableLogSpecies - lista', () => {
      const species = getAvailableLogSpecies();

      expect(species).toBeInstanceOf(Array);
      expect(species.length).toBeGreaterThan(0);
      expect(species).toContain('beech');
      expect(species).toContain('pedunculateOak');
    });

    it('getSpeciesBetaGroup - helyes csoport', () => {
      const group = getSpeciesBetaGroup('beech');
      expect(group).toBe('beech'); // BetaGroupKey: 'beech', nem 'beechGroup'
    });

    it('getSpeciesBetaGroup - ismeretlen fafaj', () => {
      const group = getSpeciesBetaGroup('unknown');
      expect(group).toBeNull();
    });
  });

  // ========================================
  // CALCULATELOGVOLUMESIMPLE
  // ========================================

  describe('calculateLogVolumeSimple - Egyszerűsített', () => {
    it('csak térfogat érték visszaadása', () => {
      const volume = calculateLogVolumeSimple('beech', 40, 4);

      expect(typeof volume).toBe('number');
      expect(volume).toBeGreaterThan(0);
      expect(volume).toBeLessThan(1);
    });

    it('megegyezik calculateLogVolume eredményével', () => {
      const full = calculateLogVolume('beech', 40, 4);
      const simple = calculateLogVolumeSimple('beech', 40, 4);

      expect(simple).toBe(full.volumeM3);
    });
  });

  // ========================================
  // EDGE CASE-EK
  // ========================================

  describe('Edge case-ek', () => {
    it('minimum értékek (12 cm, 1 m)', () => {
      const result = calculateLogVolume('beech', 12, 1);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.volumeM3).toBeLessThan(0.02); // Nagyon kicsi rönk
    });

    it('maximum értékek (100 cm, 6.6 m)', () => {
      const result = calculateLogVolume('beech', 100, 6.6);

      expect(result.volumeM3).toBeGreaterThan(4); // Nagy rönk
      expect(result.volumeM3).toBeLessThan(8);
    });

    it('különböző fafajok - konzisztencia', () => {
      const species = ['beech', 'pedunculateOak', 'blackLocust', 'spruce'];

      species.forEach((sp) => {
        const result = calculateLogVolume(sp, 40, 4);
        expect(result.volumeM3).toBeGreaterThan(0);
        expect(result.volumeM3).toBeLessThan(2);
      });
    });

    it('floating point stabilitás', () => {
      const r1 = calculateLogVolume('beech', 40, 4);
      const r2 = calculateLogVolume('beech', 40.0, 4.0);
      const r3 = calculateLogVolume('beech', 40.000001, 4.000001);

      expect(r1.volumeM3).toBe(r2.volumeM3);
      expect(Math.abs(r1.volumeM3 - r3.volumeM3)).toBeLessThan(0.0001);
    });
  });

  // ========================================
  // REGRESSZIÓS TESZTEK
  // ========================================

  describe('Regressziós tesztek - Számítási stabilitás', () => {
    it('ugyanaz a bemenet -> ugyanaz az eredmény', () => {
      const r1 = calculateLogVolume('beech', 40, 4);
      const r2 = calculateLogVolume('beech', 40, 4);

      expect(r1.volumeM3).toBe(r2.volumeM3);
      expect(r1.betaValue).toBe(r2.betaValue);
      expect(r1.tipDiameterM).toBe(r2.tipDiameterM);
      expect(r1.baseDiameterM).toBe(r2.baseDiameterM);
    });

    it('béta tartomány váltás - folytonos', () => {
      // 30 cm (small) vs 32 cm (medium)
      const r1 = calculateLogVolume('beech', 30, 4);
      const r2 = calculateLogVolume('beech', 32, 4);

      // Térfogat nem ugorhat hirtelen
      const diff = Math.abs(r2.volumeM3 - r1.volumeM3);
      expect(diff).toBeLessThan(0.1); // Max 0.1 m³ különbség
    });
  });

  // ========================================
  // PERFORMANCIA
  // ========================================

  describe('Performancia', () => {
    it('1000 számítás < 50ms', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        calculateLogVolume('beech', 40, 4);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});
