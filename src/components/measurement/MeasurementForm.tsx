import { useState, useEffect, useRef } from 'react';
import { surveyService } from '@services/surveyService';
import { textToSpeech } from '@services/textToSpeechService';
import { speechRecognition } from '@services/speechRecognitionService';
import { speciesList } from '@data/volumeTables';
import { detectSpeciesFromSpeech, speciesNames, detectControlCommand } from '@data/speciesSpeechPatterns';
import './MeasurementForm.css';

const MAX_CONFIRMATION_RETRIES = 3;

interface MeasurementFormProps {
  sessionId: string;
  transcript: string;
  onComplete: () => void;
  onClearTranscript: () => void;
  onNewTranscript?: (text: string) => void; // Új diktálás eredménye
  averageHeights?: Map<string, number>; // Fafajonkénti átlagmagasságok
  onPause?: () => void; // Szünet parancs kezelése
}

/**
 * Mérési űrlap komponens
 */
export default function MeasurementForm({
  sessionId,
  transcript,
  onComplete,
  onClearTranscript,
  onNewTranscript,
  averageHeights = new Map(),
  onPause,
}: MeasurementFormProps) {
  const [species, setSpecies] = useState('');
  const [diameter, setDiameter] = useState('');
  const [height, setHeight] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [waitingForVoiceConfirmation, setWaitingForVoiceConfirmation] = useState(false);
  const [waitingForContinuation, setWaitingForContinuation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Retry counter for voice confirmation (ref to avoid re-renders)
  const confirmationRetries = useRef(0);

  // Pending measurement values (ref to avoid closure issues in callbacks)
  const pendingMeasurement = useRef({ species: '', diameter: '', height: '' });

  // Transcript feldolgozása
  useEffect(() => {
    if (transcript) {
      parseTranscript(transcript);
    }
  }, [transcript]);

  const parseTranscript = (text: string) => {
    // 0. Kontrol parancs ellenőrzés (szünet, stb.)
    const controlCommand = detectControlCommand(text);
    if (controlCommand === 'pause' && onPause) {
      textToSpeech.speak('Felmérés szüneteltetve.');
      onPause();
      return;
    }

    // 1. Fafaj felismerése a beszédből
    const detectedSpecies = detectSpeciesFromSpeech(text);

    // 2. Számok kinyerése
    const numbers = text.match(/\d+/g);

    if (!numbers || numbers.length === 0) {
      setError('Nem sikerült feldolgozni a bemondást. Próbáld újra vagy add meg kézzel!');
      return;
    }

    const diameterNum = parseFloat(numbers[0]);

    // Páros átmérő ellenőrzés
    if (diameterNum % 2 !== 0) {
      setError('Az átmérő csak páros szám lehet (pl. 20, 22, 24 cm)! Próbáld újra!');
      onClearTranscript();
      return;
    }

    // 3. Fafaj és magasság meghatározása
    let heightValue = '';
    let speciesKey = '';

    // PRIORITÁS 1: Ha van felismert fafaj ÉS van hozzá átlagmagasság
    if (detectedSpecies && averageHeights.has(detectedSpecies)) {
      speciesKey = detectedSpecies;
      heightValue = averageHeights.get(detectedSpecies)!.toString();
      // Csak 1 szám kell (átmérő) - KÉSZ!
    }
    // PRIORITÁS 2: Ha nincs fafaj mondva, de van átlagmagasság beállítva
    else if (!detectedSpecies && averageHeights.size > 0) {
      // Használjuk az első beállított fafajt
      const firstEntry = averageHeights.entries().next().value as [string, number] | undefined;
      if (firstEntry) {
        speciesKey = firstEntry[0];
        heightValue = firstEntry[1].toString();
      }
      // Csak 1 szám kell (átmérő) - KÉSZ!
    }
    // PRIORITÁS 3: Van 2 szám (átmérő + magasság)
    else if (numbers.length >= 2) {
      speciesKey = detectedSpecies || 'beech';
      heightValue = numbers[1];
    }
    // HIBA: Nincs átlagmagasság és nincs második szám
    else {
      if (averageHeights.size === 0) {
        setError('Állíts be átlagmagasságot, vagy mondd be a magasságot is! (pl. "28, 17")');
      } else {
        setError('Mondd be a fafajt! (pl. "Bükk, 28")');
      }
      return;
    }

    // Ellenőrizzük, hogy minden érték meg van-e adva
    if (!speciesKey || !heightValue) {
      setError('Hiba a feldolgozás során. Próbáld újra!');
      return;
    }

    setDiameter(numbers[0]);
    setHeight(heightValue);
    setSpecies(speciesKey);

    // Store in ref for voice confirmation callback (avoids closure issues)
    pendingMeasurement.current = { species: speciesKey, diameter: numbers[0], height: heightValue };

    setShowConfirmation(true);
    speakConfirmation(speciesKey, numbers[0], heightValue);
  };

  const speakConfirmation = async (speciesKey: string, d: string, h: string) => {
    // Reset retry counter
    confirmationRetries.current = 0;

    try {
      const speciesName = speciesNames[speciesKey] || 'Ismeretlen fafaj';
      const text = `${speciesName}, ${d} centiméter átmérő, ${h} méter magasság. Jóváhagyod? Mondj igent vagy újrát.`;
      console.log('Speaking confirmation:', text);
      await textToSpeech.speak(text);
      console.log('TTS completed, waiting before starting voice confirmation...');

      // Kis szünet a TTS után, hogy biztosan befejeződjön
      await new Promise((resolve) => setTimeout(resolve, 300));
      startVoiceConfirmation();
    } catch (err) {
      console.error('TTS error:', err);
      // Ha TTS nem működik, akkor is indítsuk el a voice confirmation-t
      await new Promise((resolve) => setTimeout(resolve, 300));
      startVoiceConfirmation();
    }
  };

  const startVoiceConfirmation = async () => {
    console.log('Starting voice confirmation listener... (attempt', confirmationRetries.current + 1, ')');
    setWaitingForVoiceConfirmation(true);

    await speechRecognition.start(
      async (result) => {
        const transcript = result.transcript.toLowerCase().trim();
        console.log('Confirmation transcript:', transcript);

        // Reset retries on successful recognition
        confirmationRetries.current = 0;

        // Szünet parancs ellenőrzés - bármikor működik
        const controlCommand = detectControlCommand(transcript);
        if (controlCommand === 'pause' && onPause) {
          setWaitingForVoiceConfirmation(false);
          textToSpeech.speak('Felmérés szüneteltetve.');
          onPause();
          return;
        }

        // Igen szavak
        if (
          transcript.includes('igen') ||
          transcript.includes('jó') ||
          transcript.includes('jóváhagyom') ||
          transcript.includes('rendben') ||
          transcript.includes('oké') ||
          transcript.includes('ok')
        ) {
          setWaitingForVoiceConfirmation(false);
          try {
            console.log('Calling handleVoiceConfirm...');
            await handleVoiceConfirm();
            console.log('handleVoiceConfirm completed successfully');
          } catch (err) {
            console.error('handleVoiceConfirm error:', err);
            setError('Hiba a mentés során!');
          }
        }
        // Újra szavak
        else if (
          transcript.includes('újra') ||
          transcript.includes('nem') ||
          transcript.includes('újrakezd') ||
          transcript.includes('mégse')
        ) {
          setWaitingForVoiceConfirmation(false);
          handleCancel();
        }
        // Nem érthető - TTS után újra próbáljuk
        else {
          try {
            await textToSpeech.speak('Nem értettem. Mondj igent vagy újrát.');
          } catch (e) {
            console.log('TTS interrupted, continuing...');
          }
          // TTS után újraindítjuk a hallgatást
          await new Promise((resolve) => setTimeout(resolve, 300));
          startVoiceConfirmation();
        }
      },
      (error) => {
        console.error('Confirmation error:', error, '- retries:', confirmationRetries.current);

        // Retry on error (no-speech, timeout, etc.) up to MAX_CONFIRMATION_RETRIES
        if (confirmationRetries.current < MAX_CONFIRMATION_RETRIES) {
          confirmationRetries.current += 1;
          console.log('Retrying voice confirmation...');
          // Rövid várakozás, majd újra próbálja
          setTimeout(() => startVoiceConfirmation(), 500);
        } else {
          // Max retries reached - show error
          setWaitingForVoiceConfirmation(false);
          confirmationRetries.current = 0;
          setError('Nem sikerült felismerni a választ. Használd a gombokat!');
        }
      }
    );
  };

  const handleVoiceConfirm = async () => {
    // Use ref values to avoid closure issues in voice callbacks
    const currentSpecies = pendingMeasurement.current.species || species;
    const currentDiameter = pendingMeasurement.current.diameter || diameter;
    const currentHeight = pendingMeasurement.current.height || height;

    console.log('handleVoiceConfirm - using values:', { currentSpecies, currentDiameter, currentHeight });
    setError(null);

    if (!currentSpecies || !currentDiameter || !currentHeight) {
      console.log('handleVoiceConfirm - VALIDATION FAILED: missing values');
      setError('Minden mezőt tölts ki!');
      return;
    }

    const diameterNum = parseFloat(currentDiameter);
    const heightNum = parseFloat(currentHeight);

    // NaN ellenőrzés
    if (isNaN(diameterNum) || isNaN(heightNum)) {
      setError('Érvénytelen szám formátum! Kérlek számokat adj meg.');
      return;
    }

    // Átmérő validáció: 6-200 cm
    if (diameterNum < 6) {
      setError('Az átmérő nem lehet kisebb, mint 6 cm!');
      return;
    }

    if (diameterNum > 200) {
      setError('Az átmérő nem lehet nagyobb, mint 200 cm!');
      return;
    }

    // Páros átmérő ellenőrzés
    if (diameterNum % 2 !== 0) {
      setError('Az átmérő csak páros szám lehet (pl. 20, 22, 24 cm)!');
      return;
    }

    // Magasság validáció
    if (heightNum < 1) {
      setError('A magasság nem lehet kisebb, mint 1 m!');
      return;
    }

    if (heightNum > 100) {
      setError('A magasság nem lehet nagyobb, mint 100 m!');
      return;
    }

    try {
      console.log('handleVoiceConfirm - calling surveyService.addMeasurement...');
      await surveyService.addMeasurement(
        sessionId,
        currentSpecies as any,
        diameterNum,
        heightNum
      );
      console.log('handleVoiceConfirm - MEASUREMENT SAVED SUCCESSFULLY!');

      // Clear the pending measurement ref
      pendingMeasurement.current = { species: '', diameter: '', height: '' };

      // Reset
      setSpecies('');
      setDiameter('');
      setHeight('');
      setShowConfirmation(false);
      setWaitingForVoiceConfirmation(false);
      onClearTranscript();
      onComplete();

      // Sikeres visszajelzés + folytatás kérdés
      console.log('handleVoiceConfirm - speaking confirmation...');
      await textToSpeech.speak('Rögzítve. Folytatod a mérést?');

      // Folytatás kérdésre várakozás
      startContinuationConfirmation();
    } catch (err) {
      console.error('Measurement error:', err);
      setError('Hiba a mérés rögzítése során!');
    }
  };

  // Folytatás kérdésre várakozás
  const startContinuationConfirmation = async () => {
    setWaitingForContinuation(true);

    // Azonnal indítjuk a hallgatást
    await speechRecognition.start(
      (result) => {
        const response = result.transcript.toLowerCase().trim();
        console.log('Continuation response:', response);
        setWaitingForContinuation(false);

        // Szünet parancs ellenőrzés - bármikor működik
        const controlCommand = detectControlCommand(response);
        if (controlCommand === 'pause' && onPause) {
          textToSpeech.speak('Felmérés szüneteltetve.');
          onPause();
          return;
        }

        // Igen - új diktálás indítása
        if (
          response.includes('igen') ||
          response.includes('folytatom') ||
          response.includes('jó') ||
          response.includes('tovább') ||
          response.includes('ok')
        ) {
          textToSpeech.speak('Mondd!');
          setTimeout(() => {
            startNewDictation();
          }, 800);
        }
        // Nem - visszatér alapállapotba
        else if (
          response.includes('nem') ||
          response.includes('vége') ||
          response.includes('befejezem') ||
          response.includes('kész')
        ) {
          textToSpeech.speak('Rendben.');
        }
        // Nem érthető
        else {
          textToSpeech.speak('Nem értettem. Folytasd a diktálás gombbal!');
        }
      },
      (error) => {
        console.error('Continuation error:', error);
        setWaitingForContinuation(false);
      }
    );
  };

  // Új diktálás indítása automatikusan
  const startNewDictation = async () => {
    await speechRecognition.start(
      (result) => {
        console.log('New dictation result:', result.transcript);
        if (onNewTranscript) {
          onNewTranscript(result.transcript);
        }
      },
      (error) => {
        console.error('New dictation error:', error);
        setError('Hiba a diktálás során. Próbáld újra!');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!species || !diameter || !height) {
      setError('Minden mezőt tölts ki!');
      return;
    }

    const diameterNum = parseFloat(diameter);
    const heightNum = parseFloat(height);

    // NaN ellenőrzés
    if (isNaN(diameterNum) || isNaN(heightNum)) {
      setError('Érvénytelen szám formátum! Kérlek számokat adj meg.');
      return;
    }

    // Átmérő validáció: 6-200 cm
    if (diameterNum < 6) {
      setError('Az átmérő nem lehet kisebb, mint 6 cm!');
      return;
    }

    if (diameterNum > 200) {
      setError('Az átmérő nem lehet nagyobb, mint 200 cm!');
      return;
    }

    // Páros átmérő ellenőrzés
    if (diameterNum % 2 !== 0) {
      setError('Az átmérő csak páros szám lehet (pl. 20, 22, 24 cm)!');
      return;
    }

    // Magasság validáció
    if (heightNum < 1) {
      setError('A magasság nem lehet kisebb, mint 1 m!');
      return;
    }

    if (heightNum > 100) {
      setError('A magasság nem lehet nagyobb, mint 100 m!');
      return;
    }

    try {
      await surveyService.addMeasurement(
        sessionId,
        species as any,
        diameterNum,
        heightNum
      );

      // Reset
      setSpecies('');
      setDiameter('');
      setHeight('');
      setShowConfirmation(false);
      onClearTranscript();
      onComplete();

      // Sikeres visszajelzés
      await textToSpeech.speak('Rögzítve');
    } catch (err) {
      console.error('Measurement error:', err);
      setError('Hiba a mérés rögzítése során!');
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setWaitingForVoiceConfirmation(false);
    setSpecies('');
    setDiameter('');
    setHeight('');
    onClearTranscript();

    // Automatikus újraindítás
    textToSpeech.speak('Újra!');
    setTimeout(() => {
      startNewDictation();
    }, 600);
  };

  return (
    <div className="measurement-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="species">Fafaj:</label>
          <select
            id="species"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            required
          >
            <option value="">Válassz fafajt...</option>
            {speciesList.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="diameter">Átmérő (cm):</label>
            <input
              id="diameter"
              type="number"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              placeholder="pl. 28"
              min="6"
              max="200"
              step="2"
              required
            />
            <small style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
              Mellmagassági átmérő (6-200 cm, csak páros számok)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="height">Magasság (m):</label>
            <input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="pl. 17"
              min="1"
              max="100"
              step="0.1"
              required
            />
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        {showConfirmation && (
          <div className="confirmation-dialog">
            <p>✅ Jóváhagyod ezt a mérést?</p>
            {waitingForVoiceConfirmation && (
              <p className="voice-waiting">
                🎤 Várakozás a válaszodra... (Mondj "igen" vagy "újra")
              </p>
            )}
            <div className="confirmation-buttons">
              <button type="button" onClick={handleVoiceConfirm} className="btn-confirm">
                Igen, rögzítem
              </button>
              <button type="button" onClick={handleCancel} className="btn-cancel">
                Nem, újra
              </button>
            </div>
          </div>
        )}

        {waitingForContinuation && (
          <div className="continuation-dialog">
            <p>🎤 Folytatod a mérést?</p>
            <p className="voice-waiting">Várakozás a válaszodra... (Mondj "igen" vagy "nem")</p>
          </div>
        )}

        {!showConfirmation && !waitingForContinuation && (
          <button type="submit" className="btn-submit">
            ➕ Mérés rögzítése
          </button>
        )}
      </form>
    </div>
  );
}
