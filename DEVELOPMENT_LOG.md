# Erdészeti Fatömeg PWA - Fejlesztési Napló

## 2024-12-11 - Rönkköbözés Funkció Implementálása

### Összefoglaló
A rönkköbözés (csúcsátmérő szerinti köbözés) funkció teljes implementálása a Huber-Smalian formula alapján.

---

## Huber-Smalian Formula

```
V = ((d²π/4) + ((d + L×β)²π/4)) / 2 × L
```

Ahol:
- **V** = köbtartalom (m³)
- **L** = hosszúság (m)
- **d** = csúcsátmérő (m)
- **β** = sudarlóssági érték (fafaj és átmérő függvénye)

---

## Béta (β) Értékek Táblázata

| Csoport | Fafajok | 12-30 cm | 32-50 cm | 52+ cm |
|---------|---------|----------|----------|--------|
| Tölgyek | Kocsányos, Kocsánytalan, Vörös tölgy | 0.832808 | 1.115149 | 1.344139 |
| Cser | Csertölgy | 0.87481 | 1.315718 | 1.403625 |
| Bükk | Bükk | 0.944805 | 1.064244 | 1.745519 |
| Gyertyán | Gyertyán | 0.837588 | 1.175978 | 1.489784 |
| Akác | Akác | 1.019575 | 1.834808 | 1.89375 |
| Keménylombos | Juhar, Kőris, Dió | 0.837588 | 1.175978 | 1.489784 |
| Nyárak | Összes nyárfaj | 0.970457 | 1.373216 | 1.949494 |
| Fűz | Fűz | 0.970457 | 1.373216 | 1.949494 |
| Lágylombos | Éger, Hárs, Nyír | 0.868259 | 1.148209 | 1.321606 |
| Fenyők | Erdei, Fekete, Luc, Vörös, Duglász | 0.903642 | 1.422158 | 1.944522 |

---

## Létrehozott Fájlok

### 1. `src/data/logVolumeBeta.ts`
- `BetaValues` interface (small, medium, large)
- `logVolumeBetaGroups` - 10 fafajcsoport béta értékei
- `speciesToBetaGroup` - 29 fafaj mapping a 10 csoporthoz
- `getBetaValue()` - béta érték lekérdezés

### 2. `src/services/logVolumeCalculation.ts`
- `calculateLogVolume()` - Huber-Smalian formula implementáció
- `validateDiameter()` - 12-100 cm, páros szám
- `validateLength()` - 1-6.6 m
- `roundToEvenDiameter()` - kerekítés páros számra

### 3. `src/components/measurement/LogMeasurementForm.tsx`
- Fafaj és hossz preset választók
- Hangvezérlés 3 móddal
- Mérés jóváhagyás és folytatás kérdés
- Szünet parancs kezelés

### 4. `src/pages/LogSurveyPage.tsx` + CSS
- Session kezelés (létrehozás, folytatás, szünet)
- Helyszín megadás
- Mérési lista (utolsó 5)
- Összesítés és export (CSV)
- Page Visibility API - automatikus mentés

### 5. `src/data/speciesSpeechPatterns.ts`
- Fafaj felismerés beszédből (29 fafaj, magyar szinonimák)
- Kontrol parancsok (szünet, újra, igen)

### 6. `src/components/measurement/AverageHeightSettings.tsx` + CSS
- Átlagmagasság beállítás fafajonként
- Elegyes erdőhöz

---

## Módosított Fájlok

### `src/types/measurement.ts`
```typescript
// Új típusok:
interface LogMeasurement {
  id: string;
  species: string;
  tipDiameterCm: number;  // 12-100 cm
  lengthM: number;        // 1-6.6 m
  volumeM3: number;
  betaValue: number;
  timestamp: number;
}

interface LogSession {
  id: string;
  type: 'log';
  logs: LogMeasurement[];
  defaultSpecies?: string;
  defaultLengthM?: number;
  // ... többi mező
}
```

### `src/db/database.ts`
- Verzió 2: `logSessions`, `logMeasurements` táblák

### `src/services/surveyService.ts`
- `LogSurveyService` class hozzáadva
- `logSurveyService` singleton export

### `src/router.tsx`
```typescript
{
  path: '/survey/log',
  element: <LogSurveyPage />,
}
```

### `src/pages/HomePage.tsx`
- Új menüpont: "Rönkköbözés" (barna gomb)

---

## Hangvezérlés Módok

| Mód | Bemenet | Eredmény |
|-----|---------|----------|
| Csak átmérő | "28" | Preset fafaj + preset hossz + 28 cm |
| Átmérő + hossz | "28, 4" | Preset fafaj + 4 m + 28 cm |
| Teljes | "Bükk, 28, 4" | Bükk + 4 m + 28 cm |

---

## Validációs Szabályok

- **Csúcsátmérő**: 12-100 cm, csak páros számok (2 cm lépésköz)
- **Hosszúság**: 1-6.6 m
- **Fafaj**: Csak a 29 definiált fafaj közül

---

## Git Commit

```
95b63b7 Rönkköbözés funkció implementálása (Huber-Smalian formula)
```

**22 fájl módosítva, 2930 sor hozzáadva**

---

## Következő Lépések (TODO)

1. [ ] Excel (XLSX) export hozzáadása a rönkköbözéshez
2. [ ] PDF export hozzáadása a rönkköbözéshez
3. [ ] Korábbi felmérések oldalon a log session-ök megjelenítése
4. [ ] Tesztelés valós eszközön (Android/iOS)
5. [ ] Netlify deploy frissítés

---

## Projekt Struktúra

```
src/
├── components/
│   └── measurement/
│       ├── AverageHeightSettings.tsx + css  (ÚJ)
│       ├── LogMeasurementForm.tsx           (ÚJ)
│       ├── MeasurementForm.tsx
│       ├── MeasurementList.tsx
│       ├── LocationForm.tsx
│       └── VoiceInput.tsx
├── data/
│   ├── logVolumeBeta.ts                     (ÚJ)
│   ├── speciesSpeechPatterns.ts             (ÚJ)
│   └── volumeTables/
├── pages/
│   ├── LogSurveyPage.tsx + css              (ÚJ)
│   ├── StandingTreeSurveyPage.tsx + css
│   ├── SessionHistoryPage.tsx + css
│   ├── HomePage.tsx + css
│   └── SettingsPage.tsx
├── services/
│   ├── logVolumeCalculation.ts              (ÚJ)
│   ├── surveyService.ts                     (MÓDOSÍTOTT)
│   ├── volumeCalculation.ts
│   ├── speechRecognitionService.ts
│   ├── textToSpeechService.ts
│   └── exportService.ts
├── db/
│   └── database.ts                          (MÓDOSÍTOTT - v2)
├── types/
│   └── measurement.ts                       (MÓDOSÍTOTT)
└── router.tsx                               (MÓDOSÍTOTT)
```

---

## Hasznos Parancsok

```bash
# Dev szerver
npm run dev

# Build
npm run build

# Git
git status
git add src/
git commit -m "message"
git push origin main
```

---

*Utolsó frissítés: 2024-12-11*
