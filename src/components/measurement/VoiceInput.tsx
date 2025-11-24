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
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const supported = speechRecognition.isSupported();
    setIsSupported(supported);

    // Debug információk
    if (!supported) {
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent);
      const isEdge = /Edg/.test(navigator.userAgent);
      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      let debugMsg = `Böngésző: ${navigator.userAgent.split(' ').slice(-1)[0]}, `;
      debugMsg += `Safari: ${isSafari}, `;
      debugMsg += `Chrome/Edge: ${isChrome || isEdge}, `;
      debugMsg += `Protocol: ${window.location.protocol}, `;
      debugMsg += `HTTPS/Localhost: ${isHttps || isLocalhost}`;
      setDebugInfo(debugMsg);
    }
  }, []);

  const handleStart = async () => {
    setError(null);
    setIsListening(true);

    await speechRecognition.start(
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
  };

  const handleStop = async () => {
    await speechRecognition.stop();
    setIsListening(false);
  };

  if (!isSupported) {
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    return (
      <div className="voice-input">
        <div className="voice-error">
          ❌ A beszédfelismerés nem támogatott ebben a böngészőben.
          <br />
          <br />
          {(isSafari || isFirefox) && (
            <>
              <strong>⚠️ {isSafari ? 'Safari' : 'Firefox'} böngésző:</strong>
              <p style={{ marginTop: '0.5rem' }}>
                {isSafari ? 'A Safari' : 'A Firefox'} NEM támogatja a Web Speech API-t.<br />
                Használd <strong>Google Chrome</strong> vagy <strong>Microsoft Edge</strong> böngészőt a diktáláshoz.
              </p>
              <br />
            </>
          )}
          <strong>Követelmények a diktáláshoz:</strong>
          <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
            <li><strong>Chrome</strong> vagy <strong>Edge</strong> böngésző</li>
            <li>HTTPS kapcsolat (vagy localhost)</li>
            <li>Mikrofon engedély megadva</li>
          </ul>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#999' }}>
            ❌ Nem támogatott: Safari, Firefox, Opera
          </p>
          {debugInfo && (
            <details style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
              <summary>Technikai részletek</summary>
              <p style={{ marginTop: '0.5rem', fontFamily: 'monospace' }}>{debugInfo}</p>
            </details>
          )}
        </div>
        <p className="voice-hint" style={{ marginTop: '1rem' }}>
          💡 Használd a kézi bevitelt az űrlapon!
        </p>
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
