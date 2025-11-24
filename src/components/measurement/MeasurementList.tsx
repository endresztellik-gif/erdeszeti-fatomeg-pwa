import { TreeMeasurement } from '@app-types/measurement';
import { volumeFormulas, SpeciesKey } from '@data/volumeFormulas';
import './MeasurementList.css';

interface MeasurementListProps {
  trees: TreeMeasurement[];
}

/**
 * Fafaj kulcs -> név átalakítás
 */
function getSpeciesName(key: string): string {
  const params = volumeFormulas[key as SpeciesKey];
  return params ? params.species : key;
}

/**
 * Utolsó mérések listája
 */
export default function MeasurementList({ trees }: MeasurementListProps) {
  if (trees.length === 0) {
    return (
      <div className="measurement-list empty">
        <p>Még nincs rögzített mérés.</p>
        <p className="hint">Kezdd el a diktálást vagy add meg kézzel az adatokat!</p>
      </div>
    );
  }

  return (
    <div className="measurement-list">
      <h3>Utolsó {trees.length} mérés:</h3>
      <div className="measurement-items">
        {trees.map((tree, index) => (
          <div key={tree.id} className="measurement-item">
            <div className="measurement-number">{index + 1}.</div>
            <div className="measurement-details">
              <div className="measurement-species">{getSpeciesName(tree.species)}</div>
              <div className="measurement-values">
                Ø {tree.diameterCm} cm × {tree.heightM} m
              </div>
            </div>
            <div className="measurement-volume">
              {tree.volumeM3.toFixed(2)} m³
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
