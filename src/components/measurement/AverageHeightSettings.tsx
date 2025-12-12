import { useState } from 'react';
import { speciesList } from '@data/volumeTables';
import './AverageHeightSettings.css';

interface AverageHeightSettingsProps {
  averageHeights: Map<string, number>;
  onUpdate: (heights: Map<string, number>) => void;
}

/**
 * Átlagmagasság beállítások komponens elegyes erdőkhöz
 * Lehetővé teszi több fafajhoz különböző átlagmagasság megadását
 */
export default function AverageHeightSettings({
  averageHeights,
  onUpdate,
}: AverageHeightSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(averageHeights.size > 0);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [heightInput, setHeightInput] = useState('');

  // Csak azok a fafajok jelenjenek meg, amik még nincsenek hozzáadva
  const availableSpecies = speciesList.filter(
    (s) => !averageHeights.has(s.key)
  );

  const handleAdd = () => {
    if (!selectedSpecies || !heightInput) return;

    const height = parseFloat(heightInput);
    if (isNaN(height) || height < 1 || height > 50) {
      return;
    }

    const newHeights = new Map(averageHeights);
    newHeights.set(selectedSpecies, height);
    onUpdate(newHeights);

    // Reset
    setSelectedSpecies('');
    setHeightInput('');
  };

  const handleRemove = (speciesKey: string) => {
    const newHeights = new Map(averageHeights);
    newHeights.delete(speciesKey);
    onUpdate(newHeights);
  };

  const handleEdit = (speciesKey: string, newHeight: number) => {
    if (isNaN(newHeight) || newHeight < 1 || newHeight > 50) return;

    const newHeights = new Map(averageHeights);
    newHeights.set(speciesKey, newHeight);
    onUpdate(newHeights);
  };

  const getSpeciesName = (key: string): string => {
    const species = speciesList.find((s) => s.key === key);
    return species ? species.name : key;
  };

  return (
    <div className="average-height-settings">
      <button
        type="button"
        className="toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="toggle-text">
          Átlagmagasság beállítások
          {averageHeights.size > 0 && (
            <span className="badge">{averageHeights.size} fafaj</span>
          )}
        </span>
      </button>

      {isExpanded && (
        <div className="settings-content">
          <p className="help-text">
            Állítsd be a fafajok átlagmagasságát. Így a diktáláskor elég csak a fafajt és átmérőt mondani.
          </p>

          {/* Meglévő beállítások listája */}
          {averageHeights.size > 0 && (
            <div className="height-list">
              {Array.from(averageHeights.entries()).map(([speciesKey, height]) => (
                <div key={speciesKey} className="height-item">
                  <span className="species-name">{getSpeciesName(speciesKey)}</span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => handleEdit(speciesKey, parseFloat(e.target.value))}
                    min="1"
                    max="50"
                    step="0.5"
                    className="height-input-small"
                  />
                  <span className="unit">m</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(speciesKey)}
                    className="remove-button"
                    title="Törlés"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Új fafaj hozzáadása */}
          {availableSpecies.length > 0 && (
            <div className="add-species">
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                className="species-select"
              >
                <option value="">Válassz fafajt...</option>
                {availableSpecies.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                placeholder="Magasság"
                min="1"
                max="50"
                step="0.5"
                className="height-input"
              />
              <span className="unit">m</span>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedSpecies || !heightInput}
                className="add-button"
              >
                + Hozzáad
              </button>
            </div>
          )}

          {averageHeights.size > 0 && (
            <p className="example-text">
              Példa diktálás: "Bükk, huszonnyolc" → átmérő + beállított magasság
            </p>
          )}
        </div>
      )}
    </div>
  );
}
