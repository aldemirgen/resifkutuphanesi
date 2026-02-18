import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UI_TEXT } from '../utils/translations';
import { getAllSpecies, getSpeciesById, getSimilarSpecies } from '../data';
import SpeciesDetailComponent from '../components/SpeciesDetail';

export default function SpeciesPage() {
  const { id } = useParams();
  const [species, setSpecies] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllSpecies().then((allSpecies) => {
      const found = getSpeciesById(allSpecies, id);
      setSpecies(found);
      if (found) {
        setSimilar(getSimilarSpecies(found, allSpecies));
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>{UI_TEXT.loading}</p>
      </div>
    );
  }

  if (!species) {
    return (
      <div className="not-found">
        <h2>{UI_TEXT.noResults}</h2>
        <p>Aradığınız tür bulunamadı.</p>
      </div>
    );
  }

  return <SpeciesDetailComponent species={species} similarSpecies={similar} />;
}
