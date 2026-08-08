import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toUpperCaseInput, normalizeStoredText } from '../textUtils';
import RippleButton from './RippleButton';

const SAVED_POSITIONS_STORAGE_KEY = 'bei_saved_positions';

function loadSavedPositions() {
  try {
    const raw = localStorage.getItem(SAVED_POSITIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    const seen = new Set();
    const normalized = [];
    for (const item of parsed) {
      if (typeof item !== 'string') continue;
      const position = normalizeStoredText(item);
      if (!position || seen.has(position)) continue;
      seen.add(position);
      normalized.push(position);
    }

    if (normalized.length !== parsed.length || normalized.some((p, i) => p !== parsed[i])) {
      localStorage.setItem(SAVED_POSITIONS_STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch {
    return [];
  }
}

function persistSavedPositions(positions) {
  localStorage.setItem(SAVED_POSITIONS_STORAGE_KEY, JSON.stringify(positions));
}

export default function SavedPositionInput({
  value,
  onChange,
  label = 'Position Applied For',
  required = false,
}) {
  const [savedPositions, setSavedPositions] = useState(loadSavedPositions);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPositions = useMemo(() => {
    const term = normalizeStoredText(value);
    if (!term) return savedPositions;
    return savedPositions.filter((p) => p.includes(term));
  }, [savedPositions, value]);

  const normalizedValue = normalizeStoredText(value);
  const isDuplicate = savedPositions.includes(normalizedValue);
  const canSave = normalizedValue.length > 0 && !isDuplicate;
  const isLabelActive = focused || value !== '';

  const handleSavePosition = () => {
    if (!canSave) return;
    const updated = [...savedPositions, normalizedValue];
    setSavedPositions(updated);
    persistSavedPositions(updated);
    onChange(normalizedValue);
    setDropdownOpen(true);
  };

  const handleDeletePosition = (positionToDelete) => {
    const updated = savedPositions.filter((p) => p !== positionToDelete);
    setSavedPositions(updated);
    persistSavedPositions(updated);
  };

  const handleSelectPosition = (position) => {
    onChange(position);
    setDropdownOpen(false);
  };

  const handleFocus = () => {
    setFocused(true);
    if (savedPositions.length > 0) setDropdownOpen(true);
  };

  const showDropdown = dropdownOpen && savedPositions.length > 0 && filteredPositions.length > 0;

  return (
    <div ref={containerRef} className="floating-field">
      <label className={`floating-label ${isLabelActive ? 'is-active' : ''}`}>{label}</label>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(toUpperCaseInput(e.target.value));
            if (savedPositions.length > 0) setDropdownOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={() => {
            if (!containerRef.current?.contains(document.activeElement)) {
              setFocused(false);
            }
          }}
          className="floating-input floating-input-position min-w-0 flex-1"
          required={required}
          autoComplete="off"
        />
        <RippleButton
          variant="light"
          onClick={handleSavePosition}
          disabled={!canSave}
          title={isDuplicate ? 'Position already saved' : 'Save position'}
          className="shrink-0 px-2.5 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-300 disabled:hover:text-slate-600"
        >
          <Plus className="w-4 h-4" />
        </RippleButton>
      </div>

      {showDropdown && (
        <ul className="dropdown-panel absolute z-20 mt-1 w-full max-h-48 overflow-y-auto glass-card border border-slate-200/80 rounded-lg shadow-lg py-1">
          {filteredPositions.map((position, index) => (
            <li
              key={position}
              className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-blue-50/60 group ui-transition stagger-item"
              style={{ '--stagger-index': index }}
            >
              <button
                type="button"
                onClick={() => handleSelectPosition(position)}
                className="flex-1 text-left text-sm text-slate-700 truncate cursor-pointer ui-transition group-hover:text-blue-700"
              >
                {position}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePosition(position);
                }}
                title="Remove saved position"
                className="shrink-0 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-70 group-hover:opacity-100 ui-transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
