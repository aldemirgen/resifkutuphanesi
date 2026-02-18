import { useState, useEffect, useRef, useCallback } from 'react';

export function useSearchSuggestions() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Tıklama dışı kapama
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce ile API isteği
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/species?search=${encodeURIComponent(query.trim())}&limit=8`
        );
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
        setActiveIndex(-1);
      } catch {
        // sessizce geç
      }
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleKeyDown = useCallback(
    (e, onSubmit, navigate) => {
      if (!showSuggestions) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setActiveIndex(-1);
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const s = suggestions[activeIndex];
        setShowSuggestions(false);
        setActiveIndex(-1);
        navigate(`/tur/${s.id}`);
      }
    },
    [showSuggestions, suggestions, activeIndex]
  );

  const selectSuggestion = useCallback(
    (s, navigate) => {
      setShowSuggestions(false);
      setActiveIndex(-1);
      setQuery('');
      navigate(`/tur/${s.id}`);
    },
    []
  );

  const clearSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setActiveIndex(-1);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    showSuggestions,
    activeIndex,
    wrapperRef,
    handleKeyDown,
    selectSuggestion,
    clearSuggestions,
  };
}
