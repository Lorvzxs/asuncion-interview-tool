import React, { useState, useEffect } from 'react';

const POSITIONS_STORAGE_KEY = 'bei_saved_positions_v2';

const defaultPositions = [
  'SENIOR ADMINISTRATIVE ASSISTANT I',
  'ADMINISTRATIVE AIDE III',
  'ADMINISTRATIVE AIDE II',
  'ADMINISTRATIVE AIDE I',
  'ADMINISTRATIVE AIDE',
  'ADMINISTRATIVE ASSISTANT',
  'ADMINISTRATIVE ASSISTANT I',
  'ADMINISTRATIVE ASSISTANT II',
  'ADMINISTRATIVE ASSISTANT III',
  'ADMINISTRATIVE ASSISTANT IV'
];

export default function SavedPositionInput({ value, onChange, required }) {
  const [positions, setPositions] = useState([]);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(POSITIONS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPositions(parsed);
        } else {
          setPositions(defaultPositions);
          localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(defaultPositions));
        }
      } catch (e) {
        setPositions(defaultPositions);
      }
    } else {
      setPositions(defaultPositions);
      localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(defaultPositions));
    }
  }, []);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'ADD_NEW') {
      setIsCustom(true);
      onChange('');
    } else {
      onChange(val);
    }
  };

  return (
    <div className="floating-field">
      <label className="floating-label is-active">Position Applied For</label>
      
      {!isCustom ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={handleSelectChange}
            required={required}
            className="floating-input floating-input-position w-full bg-white cursor-pointer"
          >
            <option value="">Select Position...</option>
            {positions.map((pos, idx) => (
              <option key={idx} value={pos}>
                {pos}
              </option>
            ))}
            <option value="ADD_NEW" className="font-bold text-blue-600">+ Add New Position...</option>
          </select>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter new position..."
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            required={required}
            className="floating-input floating-input-position w-full"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg shrink-0"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}