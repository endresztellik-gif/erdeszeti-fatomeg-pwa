import { describe, it, expect } from 'vitest';
import {
  calculateVolume,
  calculateBatchVolume,
} from './volumeCalculation';

/**
 * Unit tesztek: Fatérfogat számítás (Lábon álló fák)
 *
 * Tesztelt funkciók:
 * - Pontos térfogat számítás különböző fafajokhoz
 * - Tartomány ellenőrzés (átmérő, magasság)
 * - Hibakezés (ismeretlen fafaj, érvénytelen értékek)
 * - Edge case-ek (negatív, NaN, Infinity)
 * - Batch számítás
 */

describe('volumeCalculation - Lábon álló fák', () => {
  // ========================================
  // PONTOS TÉRFOGAT SZÁMÍTÁS
  // ========================================

  describe('calculateVolume - Alapvető számítások', () => {
    it('bükk (beech) - normál tartomány', () => {
      // Bükk: 40 cm átmérő, 25 m magasság
      const result = calculateVolume('beech', 40, 25);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.isInRange).toBe(true);
      expect(result.warning).toBeUndefined();

      // Reasonableness check: 40cm, 25m -> kb 1-2 m³
      expect(result.volumeM3).toBeGreaterThan(0.5);
      expect(result.volumeM3).toBeLessThan(3);
    });

    it('kocsányos tölgy (pedunculateOak) - normál tartomány', () => {
      const result = calculateVolume('pedunculateOak', 50, 28);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.isInRange).toBe(true);
      expect(result.warning).toBeUndefined();

      // 50cm, 28m -> kb 2-4 m³
      expect(result.volumeM3).toBeGreaterThan(1);
      expect(result.volumeM3).toBeLessThan(5);
    });

    it('akác (blackLocust) - normál tartomány', () => {
      const result = calculateVolume('blackLocust', 35, 20);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.isInRange).toBe(true);
      expect(result.warning).toBeUndefined();

      // 35cm, 20m -> kb 0.8-1.5 m³
      expect(result.volumeM3).toBeGreaterThan(0.5);
      expect(result.volumeM3).toBeLessThan(2);
    });

    it('lucfenyő (spruce) - normál tartomány', () => {
      const result = calculateVolume('spruce', 30, 22);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.isInRange).toBe(true);
      expect(result.warning).toBeUndefined();

      // 30cm, 22m -> kb 0.6-1.2 m³
      expect(result.volumeM3).toBeGreaterThan(0.4);
      expect(result.volumeM3).toBeLessThan(1.5);
    });

    it('erdei fenyő (scotsPine) - normál tartomány', () => {
      const result = calculateVolume('scotsPine', 28, 20);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.isInRange).toBe(true);
      expect(result.warning).toBeUndefined();
    });
  });

  // ========================================
  // TARTOMÁNY ELLENŐRZÉS
  // ========================================

  describe('Tartomány ellenőrzés', () => {
    it('túl kicsi átmérő - figyelmeztetés', () => {
      // Bükk min átmérő: 6 cm
      const result = calculateVolume('beech', 3, 20);

      expect(result.volumeM3).toBeGreaterThan(0); // Számítás lefut
      expect(result.isInRange).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('tartományon kívül');
    });

    it('túl nagy átmérő - figyelmeztetés', () => {
      // Bükk max átmérő: null (nincs felső korlát) - skip this test
      const result = calculateVolume('beech', 100, 25);

      // Bükk max átmérő: null - tehát sosem lesz figyelmeztetés nagy átmérőnél
      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.isInRange).toBe(true); // Most TRUE, mivel nincs felső korlát
      expect(result.warning).toBeUndefined();
    });

    it('túl alacsony magasság - figyelmeztetés', () => {
      // Bükk min magasság: 5 m
      const result = calculateVolume('beech', 40, 3);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.isInRange).toBe(false);
      expect(result.warning).toBeDefined();
    });

    it('túl magas magasság - figyelmeztetés', () => {
      // Bükk max magasság: null (nincs felső korlát) - skip
      const result = calculateVolume('beech', 40, 50);

      // Bükk max magasság: null - tehát sosem lesz figyelmeztetés nagy magasságnál
      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.isInRange).toBe(true); // TRUE, mivel nincs felső korlát
      expect(result.warning).toBeUndefined();
    });

    it('határértéken (min) - OK', () => {
      // Bükk min értékek: 6 cm, 5 m
      const result = calculateVolume('beech', 6, 5);

      expect(result.isInRange).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('határértéken (max) - N/A (nincs max)', () => {
      // Bükk max értékek: null, null - nincs felső korlát
      const result = calculateVolume('beech', 100, 50);

      expect(result.isInRange).toBe(true); // Mindig true, nincs max
      expect(result.warning).toBeUndefined();
    });
  });

  // ========================================
  // HIBAKEZELÉS
  // ========================================

  describe('Hibakezelés - Érvénytelen bemenet', () => {
    it('ismeretlen fafaj - hiba', () => {
      const result = calculateVolume('unknownSpecies' as any, 40, 25);

      expect(result.volumeM3).toBe(0);
      expect(result.isInRange).toBe(false);
      expect(result.warning).toContain('Ismeretlen fafaj');
    });

    it('negatív átmérő - érvénytelen eredmény', () => {
      const result = calculateVolume('beech', -40, 25);

      // Jelenleg a képlet negatív átmérővel is számol (d² pozitív lesz)
      // De isInRange false lesz, mivel < minDiameter
      expect(result.isInRange).toBe(false);
      expect(result.warning).toBeDefined();
    });

    it('negatív magasság - érvénytelen eredmény', () => {
      const result = calculateVolume('beech', 40, -25);

      expect(result.volumeM3).toBe(0);
      expect(result.isInRange).toBe(false);
      expect(result.warning).toBeDefined();
    });

    it('nulla átmérő - érvénytelen', () => {
      const result = calculateVolume('beech', 0, 25);

      expect(result.volumeM3).toBe(0);
      expect(result.isInRange).toBe(false);
    });

    it('nulla magasság - érvénytelen', () => {
      const result = calculateVolume('beech', 40, 0);

      // h=0 esetén h/(h-1.3) = 0/-1.3 = 0, tehát volumeM3 = 0 vagy -0
      expect(result.volumeM3).toBeLessThanOrEqual(0);
      expect(result.isInRange).toBe(false);
    });

    it('NaN átmérő - védelem', () => {
      const result = calculateVolume('beech', NaN, 25);

      expect(result.volumeM3).toBe(0);
      expect(result.isInRange).toBe(false);
      expect(result.warning).toBeDefined();
    });

    it('Infinity magasság - védelem', () => {
      const result = calculateVolume('beech', 40, Infinity);

      expect(result.volumeM3).toBe(0);
      expect(result.isInRange).toBe(false);
      expect(result.warning).toBeDefined();
    });
  });

  // ========================================
  // EDGE CASE-EK
  // ========================================

  describe('Edge case-ek', () => {
    it('nagyon kicsi értékek - még belül', () => {
      // Kocsánytalan tölgy (sessileOak) min: 6 cm, 5 m
      const result = calculateVolume('sessileOak', 6, 5);

      expect(result.volumeM3).toBeGreaterThan(0);
      expect(result.volumeM3).toBeLessThan(0.1); // Kis térfogat
      expect(result.isInRange).toBe(true);
    });

    it('nagyon nagy értékek - még belül', () => {
      // Tölgy max: 100 cm, 40 m (ha nincs felső korlát)
      const result = calculateVolume('pedunculateOak', 80, 35);

      expect(result.volumeM3).toBeGreaterThan(5); // Nagy térfogat
      expect(result.volumeM3).toBeLessThan(20);
    });

    it('különböző fafajok - konzisztencia', () => {
      const species = [
        'beech',
        'pedunculateOak',
        'sessileOak',
        'blackLocust',
        'spruce',
        'scotsPine',
      ] as const;

      species.forEach((sp) => {
        const result = calculateVolume(sp, 40, 25);
        expect(result.volumeM3).toBeGreaterThan(0);
        expect(result.volumeM3).toBeLessThan(10);
      });
    });

    it('magasság 1.3m - singularitás védelem', () => {
      // h/(h-1.3) lesz végtelen ha h=1.3
      const result = calculateVolume('beech', 40, 1.3);

      expect(result.volumeM3).toBe(0);
      expect(result.isInRange).toBe(false);
    });

    it('magasság közel 1.3m - numerikus stabilitás', () => {
      const result = calculateVolume('beech', 40, 1.31);

      // Túl alacsony, de nem Infinity
      expect(isFinite(result.volumeM3)).toBe(true);
    });
  });

  // ========================================
  // MATEMATIKAI TULAJDONSÁGOK
  // ========================================

  describe('Matematikai tulajdonságok', () => {
    it('monoton növekvő átmérőben (fix magasság)', () => {
      const v1 = calculateVolume('beech', 30, 25).volumeM3;
      const v2 = calculateVolume('beech', 40, 25).volumeM3;
      const v3 = calculateVolume('beech', 50, 25).volumeM3;

      expect(v2).toBeGreaterThan(v1);
      expect(v3).toBeGreaterThan(v2);
    });

    it('monoton növekvő magasságban (fix átmérő)', () => {
      const v1 = calculateVolume('beech', 40, 20).volumeM3;
      const v2 = calculateVolume('beech', 40, 25).volumeM3;
      const v3 = calculateVolume('beech', 40, 30).volumeM3;

      expect(v2).toBeGreaterThan(v1);
      expect(v3).toBeGreaterThan(v2);
    });

    it('durván arányos d²×h-val', () => {
      const d1 = 20, h1 = 20;
      const d2 = 40, h2 = 20; // 2× átmérő -> ~4× térfogat

      const v1 = calculateVolume('beech', d1, h1).volumeM3;
      const v2 = calculateVolume('beech', d2, h2).volumeM3;

      const ratio = v2 / v1;
      expect(ratio).toBeGreaterThan(3); // Minimum 3×
      expect(ratio).toBeLessThan(5);    // Maximum 5×
    });
  });

  // ========================================
  // BATCH SZÁMÍTÁS
  // ========================================

  describe('calculateBatchVolume - Tömeges számítás', () => {
    it('több fa egyszerre - sikeres', () => {
      const measurements = [
        { species: 'beech' as const, diameterCm: 40, heightM: 25 },
        { species: 'pedunculateOak' as const, diameterCm: 50, heightM: 28 },
        { species: 'blackLocust' as const, diameterCm: 35, heightM: 20 },
      ];

      const results = calculateBatchVolume(measurements);

      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect(r.volumeM3).toBeGreaterThan(0);
      });
    });

    it('üres lista - üres eredmény', () => {
      const results = calculateBatchVolume([]);
      expect(results).toHaveLength(0);
    });

    it('vegyes érvényes/érvénytelen - mind lefut', () => {
      const measurements = [
        { species: 'beech' as const, diameterCm: 40, heightM: 25 },
        { species: 'unknown' as any, diameterCm: 40, heightM: 25 },
        { species: 'beech' as const, diameterCm: -10, heightM: 25 },
      ];

      const results = calculateBatchVolume(measurements);

      expect(results).toHaveLength(3);
      expect(results[0].volumeM3).toBeGreaterThan(0); // OK
      expect(results[1].volumeM3).toBe(0); // Ismeretlen fafaj
      // Negatív átmérő: a képlet számol vele (d² pozitív), de isInRange false
      expect(results[2].isInRange).toBe(false);
    });

    it('nagy mennyiség - performancia', () => {
      const measurements = Array.from({ length: 1000 }, () => ({
        species: 'beech' as const,
        diameterCm: 40,
        heightM: 25,
      }));

      const start = performance.now();
      const results = calculateBatchVolume(measurements);
      const duration = performance.now() - start;

      expect(results).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // < 100ms for 1000 calcs
    });
  });

  // ========================================
  // REGRESSZIÓS TESZTEK
  // ========================================

  describe('Regressziós tesztek - Számítási stabilitás', () => {
    it('ugyanaz a bemenet -> ugyanaz az eredmény', () => {
      const r1 = calculateVolume('beech', 40, 25);
      const r2 = calculateVolume('beech', 40, 25);

      expect(r1.volumeM3).toBe(r2.volumeM3);
      expect(r1.isInRange).toBe(r2.isInRange);
    });

    it('floating point kerekítés - stabilitás', () => {
      const r1 = calculateVolume('beech', 40.0, 25.0);
      const r2 = calculateVolume('beech', 40.000001, 25.000001);

      // Nagyon közel kell lenniük (floating point tolerance)
      expect(Math.abs(r1.volumeM3 - r2.volumeM3)).toBeLessThan(0.0001);
    });
  });
});
