import { useState, useEffect } from 'react';
import { surveyService } from '@services/surveyService';
import { textToSpeech } from '@services/textToSpeechService';
import { speciesList } from '@data/volumeTables';
import './MeasurementForm.css';

interface MeasurementFormProps {
  sessionId: string;
  transcript: string;
  onComplete: () => void;
  onClearTranscript: () => void;
}

/**
 * Mérési űrlap komponens
 */
export default function MeasurementForm({
  sessionId,
  transcript,
  onComplete,
  onClearTranscript,
}: MeasurementFormProps) {
  const [species, setSpecies] = useState('');
  const [diameter, setDiameter] = useState('');
  const [height, setHeight] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transcript feldolgozása
  useEffect(() => {
    if (transcript) {
      parseTranscript(transcript);
    }
  }, [transcript]);

  const parseTranscript = (text: string) => {
    // Egyszerű parser - számok kinyerése
    const numbers = text.match(/\d+/g);

    if (numbers && numbers.length >= 2) {
      const diameterNum = parseFloat(numbers[0]);

      // Páros átmérő ellenőrzés
      if (diameterNum % 2 !== 0) {
        setError('Az átmérő csak páros szám lehet (pl. 20, 22, 24 cm)! Próbáld újra!');
        onClearTranscript();
        return;
      }

      setDiameter(numbers[0]);
      setHeight(numbers[1]);

      // Fafaj (egyenlőre csak bükk támogatott)
      setSpecies('beech');

      setShowConfirmation(true);
      speakConfirmation(numbers[0], numbers[1]);
    } else {
      setError('Nem sikerült feldolgozni a bemondást. Próbáld újra vagy add meg kézzel!');
    }
  };

  const speakConfirmation = async (d: string, h: string) => {
    try {
      const text = `Bükk, ${d} centiméter átmérő, ${h} méter magasság. Jóváhagyod?`;
      await textToSpeech.speak(text);
    } catch (err) {
      console.error('TTS error:', err);
    }
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
    setSpecies('');
    setDiameter('');
    setHeight('');
    onClearTranscript();
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
            <div className="confirmation-buttons">
              <button type="submit" className="btn-confirm">
                Igen, rögzítem
              </button>
              <button type="button" onClick={handleCancel} className="btn-cancel">
                Nem, újra
              </button>
            </div>
          </div>
        )}

        {!showConfirmation && (
          <button type="submit" className="btn-submit">
            ➕ Mérés rögzítése
          </button>
        )}
      </form>
    </div>
  );
}
