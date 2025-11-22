import { useState, useEffect } from 'react';
import { speechRecognition } from '@services/speechRecognitionService';
import { SpeechRecognitionResult } from '@app-types/volumeTable';
import './VoiceInput.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

/**
 * Hangalapú bevitel komponens
 * Web Speech API használatával
 */
export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(speechRecognition.isSupported());
  }, []);

  const handleStart = () => {
    setError(null);

    speechRecognition.start(
      (result: SpeechRecognitionResult) => {
        console.log('Transcript:', result.transcript, 'Confidence:', result.confidence);
        onTranscript(result.transcript);
        setIsListening(false);
      },
      (err: string) => {
        console.error('Speech recognition error:', err);
        setError(err);
        setIsListening(false);
      }
    );

    setIsListening(true);
  };

  const handleStop = () => {
    speechRecognition.stop();
    setIsListening(false);
  };

  if (!isSupported) {
    return (
      <div className="voice-input">
        <div className="voice-error">
          ❌ A beszédfelismerés nem támogatott ebben a böngészőben.
          <br />
          Használj Chrome-ot vagy Edge-et!
        </div>
      </div>
    );
  }

  return (
    <div className="voice-input">
      <button
        onClick={isListening ? handleStop : handleStart}
        className={`mic-button ${isListening ? 'listening' : ''}`}
        type="button"
      >
        <span className="mic-icon">{isListening ? '🔴' : '🎤'}</span>
        <span className="mic-text">
          {isListening ? 'Hallgatlak...' : 'Diktálás indítása'}
        </span>
      </button>

      {error && (
        <div className="voice-error">
          ⚠️ {error}
        </div>
      )}

      <p className="voice-hint">
        💡 Mondj be egy mérést: pl. "Bükk, huszonnyolc centiméter, tizenhét méter"
      </p>
    </div>
  );
}
