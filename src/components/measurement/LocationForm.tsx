import { useState } from 'react';
import './LocationForm.css';

interface LocationFormProps {
  onLocationChange: (location: LocationData) => void;
  initialData?: LocationData;
}

export interface LocationData {
  type: 'erdoreszlet' | 'helyrajzi';
  // Erdőrészlet adatok
  kozseg?: string;
  erdotag?: string;
  erdoreszlet?: string;
  // Helyrajzi szám
  helyrajziSzam?: string;
}

/**
 * Felmérés helye komponens
 * Erdőrészlet vagy Helyrajzi szám megadása
 */
export default function LocationForm({ onLocationChange, initialData }: LocationFormProps) {
  const [locationType, setLocationType] = useState<'erdoreszlet' | 'helyrajzi'>(
    initialData?.type || 'erdoreszlet'
  );
  const [kozseg, setKozseg] = useState(initialData?.kozseg || '');
  const [erdotag, setErdotag] = useState(initialData?.erdotag || '');
  const [erdoreszlet, setErdoreszlet] = useState(initialData?.erdoreszlet || '');
  const [helyrajziSzam, setHelyrajziSzam] = useState(initialData?.helyrajziSzam || '');

  const handleTypeChange = (type: 'erdoreszlet' | 'helyrajzi') => {
    setLocationType(type);
    updateLocation(type);
  };

  const updateLocation = (type?: 'erdoreszlet' | 'helyrajzi') => {
    const currentType = type || locationType;
    const locationData: LocationData = {
      type: currentType,
    };

    if (currentType === 'erdoreszlet') {
      locationData.kozseg = kozseg;
      locationData.erdotag = erdotag;
      locationData.erdoreszlet = erdoreszlet;
    } else {
      locationData.helyrajziSzam = helyrajziSzam;
    }

    onLocationChange(locationData);
  };

  return (
    <div className="location-form">
      <h3>📍 Felmérés helye</h3>

      <div className="location-type-selector">
        <button
          type="button"
          className={`type-button ${locationType === 'erdoreszlet' ? 'active' : ''}`}
          onClick={() => handleTypeChange('erdoreszlet')}
        >
          Erdőrészlet
        </button>
        <button
          type="button"
          className={`type-button ${locationType === 'helyrajzi' ? 'active' : ''}`}
          onClick={() => handleTypeChange('helyrajzi')}
        >
          Helyrajzi szám
        </button>
      </div>

      {locationType === 'erdoreszlet' ? (
        <div className="location-fields">
          <div className="form-group">
            <label htmlFor="kozseg">Község:</label>
            <input
              id="kozseg"
              type="text"
              value={kozseg}
              onChange={(e) => {
                setKozseg(e.target.value);
                updateLocation();
              }}
              onBlur={() => updateLocation()}
              placeholder="pl. Sopron"
            />
          </div>

          <div className="form-group">
            <label htmlFor="erdotag">Erdőtag:</label>
            <input
              id="erdotag"
              type="text"
              value={erdotag}
              onChange={(e) => {
                setErdotag(e.target.value);
                updateLocation();
              }}
              onBlur={() => updateLocation()}
              placeholder="pl. A"
            />
          </div>

          <div className="form-group">
            <label htmlFor="erdoreszlet">Erdőrészlet:</label>
            <input
              id="erdoreszlet"
              type="text"
              value={erdoreszlet}
              onChange={(e) => {
                setErdoreszlet(e.target.value);
                updateLocation();
              }}
              onBlur={() => updateLocation()}
              placeholder="pl. 42a"
            />
          </div>
        </div>
      ) : (
        <div className="location-fields">
          <div className="form-group">
            <label htmlFor="kozseg-hrsz">Község:</label>
            <input
              id="kozseg-hrsz"
              type="text"
              value={kozseg}
              onChange={(e) => {
                setKozseg(e.target.value);
                updateLocation();
              }}
              onBlur={() => updateLocation()}
              placeholder="pl. Sopron"
            />
          </div>

          <div className="form-group">
            <label htmlFor="helyrajzi">Helyrajzi szám:</label>
            <input
              id="helyrajzi"
              type="text"
              value={helyrajziSzam}
              onChange={(e) => {
                setHelyrajziSzam(e.target.value);
                updateLocation();
              }}
              onBlur={() => updateLocation()}
              placeholder="pl. 025/2b"
            />
          </div>
        </div>
      )}

      {locationType === 'erdoreszlet' && (kozseg || erdotag || erdoreszlet) && (
        <div className="location-preview">
          <strong>Megadva:</strong>{' '}
          {kozseg} {erdotag}{erdoreszlet}
        </div>
      )}

      {locationType === 'helyrajzi' && (kozseg || helyrajziSzam) && (
        <div className="location-preview">
          <strong>Megadva:</strong> {kozseg} {helyrajziSzam}
        </div>
      )}
    </div>
  );
}
