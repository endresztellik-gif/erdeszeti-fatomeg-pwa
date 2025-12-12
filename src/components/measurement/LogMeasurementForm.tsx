import { useState, useEffect, useRef } from 'react';
import { logSurveyService } from '@services/surveyService';
import { textToSpeech } from '@services/textToSpeechService';
import { speechRecognition } from '@services/speechRecognitionService';
import {
  detectSpeciesFromSpeech,
  speciesNames,
  detectControlCommand,
} from '@data/speciesSpeechPatterns';
import { getAvailableLogSpecies } from '@services/logVolumeCalculation';
import { betaGroupNames, speciesToBetaGroup } from '@data/logVolumeBeta';
import './MeasurementForm.css';

const MAX_CONFIRMATION_RETRIES = 3;

// Standard log lengths (1-6 m, 0.5 steps)
const LOG_LENGTHS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.6];

interface LogMeasurementFormProps {
  sessionId: string;
  transcript: string;
  onComplete: () => void;
  onClearTranscript: () => void;
  onNewTranscript?: (text: string) => void;
  defaultSpecies?: string;
  defaultLength?: number;
  onDefaultsChange?: (species: string, length: number) => void;
  onPause?: () => void;
}

/**
 * Rönkköbözés mérési űrlap komponens
 * Hangvezérlés módok:
 * - "28" -> átmérő, preset fafaj és hossz
 * - "28, 4" -> átmérő + hossz, preset fafaj
 * - "Bükk, 28, 4" -> fafaj + átmérő + hossz
 */
export default function LogMeasurementForm({
  sessionId,
  transcript,
  onComplete,
  onClearTranscript,
  onNewTranscript,
  defaultSpecies = '',
  defaultLength = 4,
  onDefaultsChange,
  onPause,
}: LogMeasurementFormProps) {
  const [species, setSpecies] = useState(defaultSpecies);
  const [diameter, setDiameter] = useState('');
  const [length, setLength] = useState(defaultLength.toString());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [waitingForVoiceConfirmation, setWaitingForVoiceConfirmation] =
    useState(false);
  const [waitingForContinuation, setWaitingForContinuation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preset selectors
  const [presetSpecies, setPresetSpecies] = useState(defaultSpecies);
  const [presetLength, setPresetLength] = useState(defaultLength.toString());

  const confirmationRetries = useRef(0);
  const pendingMeasurement = useRef({ species: '', diameter: '', length: '' });

  // Get available species for log measurement
  const availableSpecies = getAvailableLogSpecies();

  // Sync presets with parent
  useEffect(() => {
    if (onDefaultsChange && presetSpecies && presetLength) {
      onDefaultsChange(presetSpecies, parseFloat(presetLength));
    }
  }, [presetSpecies, presetLength, onDefaultsChange]);

  // Process voice transcript
  useEffect(() => {
    if (transcript) {
      parseTranscript(transcript);
    }
  }, [transcript]);

  const parseTranscript = (text: string) => {
    // Control command check (pause, etc.)
    const controlCommand = detectControlCommand(text);
    if (controlCommand === 'pause' && onPause) {
      textToSpeech.speak('Felmérés szüneteltetve.');
      onPause();
      return;
    }

    // Detect species from speech
    const detectedSpecies = detectSpeciesFromSpeech(text);

    // Extract numbers (diameter and optional length)
    const numbers = text.match(/\d+(?:[.,]\d+)?/g);

    if (!numbers || numbers.length === 0) {
      setError(
        'Nem sikerült feldolgozni. Próbáld újra vagy add meg kézzel!'
      );
      return;
    }

    // Parse first number as diameter
    const diameterStr = numbers[0].replace(',', '.');
    const diameterNum = parseFloat(diameterStr);

    // Validate diameter (12-100 cm, even only)
    if (diameterNum < 12 || diameterNum > 100) {
      setError('Az átmérő 12-100 cm között kell legyen!');
      onClearTranscript();
      return;
    }

    // Round to nearest even number
    const roundedDiameter = Math.round(diameterNum / 2) * 2;
    if (roundedDiameter < 12) {
      setError('Az átmérő minimum 12 cm!');
      onClearTranscript();
      return;
    }

    // Determine species
    let speciesKey = '';
    let lengthValue = '';

    // MODE 1: Full (species + diameter + length)
    if (detectedSpecies && numbers.length >= 2) {
      speciesKey = detectedSpecies;
      lengthValue = numbers[1].replace(',', '.');
    }
    // MODE 2: Diameter + Length (use preset species)
    else if (numbers.length >= 2 && !detectedSpecies) {
      speciesKey = presetSpecies || 'beech';
      lengthValue = numbers[1].replace(',', '.');
    }
    // MODE 3: Diameter only (use presets)
    else if (numbers.length === 1) {
      speciesKey = detectedSpecies || presetSpecies || 'beech';
      lengthValue = presetLength || '4';
    }
    // MODE 4: Species + Diameter (use preset length)
    else if (detectedSpecies && numbers.length === 1) {
      speciesKey = detectedSpecies;
      lengthValue = presetLength || '4';
    }

    // Fallback if still empty
    if (!speciesKey) {
      speciesKey = presetSpecies || 'beech';
    }
    if (!lengthValue) {
      lengthValue = presetLength || '4';
    }

    // Validate length (1-6.6 m)
    const lengthNum = parseFloat(lengthValue);
    if (lengthNum < 1 || lengthNum > 6.6) {
      setError('A hossz 1-6.6 m között kell legyen!');
      onClearTranscript();
      return;
    }

    // Check if species is valid for log calculation
    if (!availableSpecies.includes(speciesKey)) {
      setError(`A ${speciesNames[speciesKey] || speciesKey} fafajhoz nincs béta érték!`);
      return;
    }

    setDiameter(roundedDiameter.toString());
    setLength(lengthValue);
    setSpecies(speciesKey);

    pendingMeasurement.current = {
      species: speciesKey,
      diameter: roundedDiameter.toString(),
      length: lengthValue,
    };

    setShowConfirmation(true);
    speakConfirmation(speciesKey, roundedDiameter.toString(), lengthValue);
  };

  const speakConfirmation = async (
    speciesKey: string,
    d: string,
    l: string
  ) => {
    confirmationRetries.current = 0;

    try {
      const speciesName = speciesNames[speciesKey] || 'Ismeretlen fafaj';
      const text = `${speciesName}, ${d} centi csúcsátmérő, ${l} méter. Jóváhagyod?`;
      await textToSpeech.speak(text);

      await new Promise((resolve) => setTimeout(resolve, 300));
      startVoiceConfirmation();
    } catch (err) {
      console.error('TTS error:', err);
      await new Promise((resolve) => setTimeout(resolve, 300));
      startVoiceConfirmation();
    }
  };

  const startVoiceConfirmation = async () => {
    setWaitingForVoiceConfirmation(true);

    await speechRecognition.start(
      async (result) => {
        const response = result.transcript.toLowerCase().trim();
        confirmationRetries.current = 0;

        const controlCommand = detectControlCommand(response);
        if (controlCommand === 'pause' && onPause) {
          setWaitingForVoiceConfirmation(false);
          textToSpeech.speak('Felmérés szüneteltetve.');
          onPause();
          return;
        }

        if (
          response.includes('igen') ||
          response.includes('jó') ||
          response.includes('rendben') ||
          response.includes('oké') ||
          response.includes('ok')
        ) {
          setWaitingForVoiceConfirmation(false);
          await handleVoiceConfirm();
        } else if (
          response.includes('újra') ||
          response.includes('nem') ||
          response.includes('mégse')
        ) {
          setWaitingForVoiceConfirmation(false);
          handleCancel();
        } else {
          try {
            await textToSpeech.speak('Mondj igent vagy újrát.');
          } catch (e) {
            /* ignore */
          }
          await new Promise((resolve) => setTimeout(resolve, 300));
          startVoiceConfirmation();
        }
      },
      (error) => {
        console.error('Confirmation error:', error);

        if (confirmationRetries.current < MAX_CONFIRMATION_RETRIES) {
          confirmationRetries.current += 1;
          setTimeout(() => startVoiceConfirmation(), 500);
        } else {
          setWaitingForVoiceConfirmation(false);
          confirmationRetries.current = 0;
          setError('Nem sikerült felismerni. Használd a gombokat!');
        }
      }
    );
  };

  const handleVoiceConfirm = async () => {
    const currentSpecies = pendingMeasurement.current.species || species;
    const currentDiameter = pendingMeasurement.current.diameter || diameter;
    const currentLength = pendingMeasurement.current.length || length;

    setError(null);

    if (!currentSpecies || !currentDiameter || !currentLength) {
      setError('Minden mezőt tölts ki!');
      return;
    }

    const diameterNum = parseFloat(currentDiameter);
    const lengthNum = parseFloat(currentLength);

    if (isNaN(diameterNum) || isNaN(lengthNum)) {
      setError('Érvénytelen szám formátum!');
      return;
    }

    // Diameter validation: 12-100 cm, even
    if (diameterNum < 12 || diameterNum > 100) {
      setError('Az átmérő 12-100 cm között kell legyen!');
      return;
    }

    if (diameterNum % 2 !== 0) {
      setError('Az átmérő csak páros szám lehet!');
      return;
    }

    // Length validation: 1-6.6 m
    if (lengthNum < 1 || lengthNum > 6.6) {
      setError('A hossz 1-6.6 m között kell legyen!');
      return;
    }

    try {
      await logSurveyService.addMeasurement(
        sessionId,
        currentSpecies,
        diameterNum,
        lengthNum
      );

      pendingMeasurement.current = { species: '', diameter: '', length: '' };

      setSpecies(presetSpecies);
      setDiameter('');
      setLength(presetLength);
      setShowConfirmation(false);
      setWaitingForVoiceConfirmation(false);
      onClearTranscript();
      onComplete();

      await textToSpeech.speak('Rögzítve. Folytatod?');
      startContinuationConfirmation();
    } catch (err) {
      console.error('Measurement error:', err);
      setError('Hiba a mérés rögzítése során!');
    }
  };

  const startContinuationConfirmation = async () => {
    setWaitingForContinuation(true);

    await speechRecognition.start(
      (result) => {
        const response = result.transcript.toLowerCase().trim();
        setWaitingForContinuation(false);

        const controlCommand = detectControlCommand(response);
        if (controlCommand === 'pause' && onPause) {
          textToSpeech.speak('Felmérés szüneteltetve.');
          onPause();
          return;
        }

        if (
          response.includes('igen') ||
          response.includes('folytatom') ||
          response.includes('jó') ||
          response.includes('tovább')
        ) {
          textToSpeech.speak('Mondd!');
          setTimeout(() => startNewDictation(), 800);
        } else if (
          response.includes('nem') ||
          response.includes('vége') ||
          response.includes('kész')
        ) {
          textToSpeech.speak('Rendben.');
        } else {
          textToSpeech.speak('Folytasd a diktálás gombbal!');
        }
      },
      (error) => {
        console.error('Continuation error:', error);
        setWaitingForContinuation(false);
      }
    );
  };

  const startNewDictation = async () => {
    await speechRecognition.start(
      (result) => {
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

    const speciesValue = species || presetSpecies;

    if (!speciesValue || !diameter || !length) {
      setError('Minden mezőt tölts ki!');
      return;
    }

    const diameterNum = parseFloat(diameter);
    const lengthNum = parseFloat(length);

    if (isNaN(diameterNum) || isNaN(lengthNum)) {
      setError('Érvénytelen szám formátum!');
      return;
    }

    if (diameterNum < 12 || diameterNum > 100) {
      setError('Az átmérő 12-100 cm között kell legyen!');
      return;
    }

    if (diameterNum % 2 !== 0) {
      setError('Az átmérő csak páros szám lehet!');
      return;
    }

    if (lengthNum < 1 || lengthNum > 6.6) {
      setError('A hossz 1-6.6 m között kell legyen!');
      return;
    }

    try {
      await logSurveyService.addMeasurement(
        sessionId,
        speciesValue,
        diameterNum,
        lengthNum
      );

      setDiameter('');
      setShowConfirmation(false);
      onClearTranscript();
      onComplete();

      await textToSpeech.speak('Rögzítve');
    } catch (err) {
      console.error('Measurement error:', err);
      setError('Hiba a mérés rögzítése során!');
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setWaitingForVoiceConfirmation(false);
    setSpecies(presetSpecies);
    setDiameter('');
    setLength(presetLength);
    onClearTranscript();

    textToSpeech.speak('Újra!');
    setTimeout(() => startNewDictation(), 600);
  };

  // Get beta group name for display
  const getBetaGroupDisplay = (speciesKey: string): string => {
    const group = speciesToBetaGroup[speciesKey];
    return group ? betaGroupNames[group] : '';
  };

  return (
    <div className="measurement-form">
      {/* Preset selectors */}
      <div className="presets-section" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0f7ed', borderRadius: '10px' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#2d5016' }}>Alapértékek beállítása</h4>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="presetSpecies">Fafaj:</label>
            <select
              id="presetSpecies"
              value={presetSpecies}
              onChange={(e) => {
                setPresetSpecies(e.target.value);
                setSpecies(e.target.value);
              }}
            >
              <option value="">Válassz fafajt...</option>
              {availableSpecies.map((key) => (
                <option key={key} value={key}>
                  {speciesNames[key]} ({getBetaGroupDisplay(key)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="presetLength">Hossz (m):</label>
            <select
              id="presetLength"
              value={presetLength}
              onChange={(e) => {
                setPresetLength(e.target.value);
                setLength(e.target.value);
              }}
            >
              {LOG_LENGTHS.map((l) => (
                <option key={l} value={l}>
                  {l} m
                </option>
              ))}
            </select>
          </div>
        </div>
        <small style={{ color: '#666', fontSize: '0.8rem' }}>
          Hangvezérlés: "28" (csak átmérő) | "28, 4" (átmérő, hossz) | "Bükk, 28, 4" (fafaj, átmérő, hossz)
        </small>
      </div>

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
            {availableSpecies.map((key) => (
              <option key={key} value={key}>
                {speciesNames[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="diameter">Csúcsátmérő (cm):</label>
            <input
              id="diameter"
              type="number"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              placeholder="pl. 28"
              min="12"
              max="100"
              step="2"
              required
            />
            <small
              style={{
                fontSize: '0.75rem',
                color: '#666',
                marginTop: '0.25rem',
                display: 'block',
              }}
            >
              12-100 cm, csak páros számok
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="length">Hossz (m):</label>
            <input
              id="length"
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="pl. 4"
              min="1"
              max="6.6"
              step="0.1"
              required
            />
            <small
              style={{
                fontSize: '0.75rem',
                color: '#666',
                marginTop: '0.25rem',
                display: 'block',
              }}
            >
              1-6.6 m
            </small>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        {showConfirmation && (
          <div className="confirmation-dialog">
            <p>Jóváhagyod ezt a mérést?</p>
            {waitingForVoiceConfirmation && (
              <p className="voice-waiting">
                Várakozás... (Mondj "igen" vagy "újra")
              </p>
            )}
            <div className="confirmation-buttons">
              <button
                type="button"
                onClick={handleVoiceConfirm}
                className="btn-confirm"
              >
                Igen, rögzítem
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-cancel"
              >
                Nem, újra
              </button>
            </div>
          </div>
        )}

        {waitingForContinuation && (
          <div className="continuation-dialog">
            <p>Folytatod a mérést?</p>
            <p className="voice-waiting">Várakozás... (Mondj "igen" vagy "nem")</p>
          </div>
        )}

        {!showConfirmation && !waitingForContinuation && (
          <button type="submit" className="btn-submit">
            Mérés rögzítése
          </button>
        )}
      </form>
    </div>
  );
}
