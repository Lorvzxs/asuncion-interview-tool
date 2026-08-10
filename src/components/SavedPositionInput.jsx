import React, { useState, useEffect } from 'react';

const POSITIONS_STORAGE_KEY = 'bei_saved_positions';

const defaultPositions = [
  'SENIOR ADMINISTRATIVE ASSISTANT I',
  'ADMINISTRATIVE AIDE III',
];

export default function SavedPositionInput({ value, onChange, required }) {
  const [positions, setPositions] = useState([]);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(POSITIONS_STORAGE_KEY);
    if (saved) {
      try {
        setPositions(JSON.parse(saved));
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
    <div className="relative">
      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
        Position Applied For
      </label>
      
      {!isCustom ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={handleSelectChange}
            required={required}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 ui-transition"
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}