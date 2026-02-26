import React, { useState } from 'react';
import { searchPlace } from '../services/mapService';

const LocationSearch = ({ placeholder, onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e) => {
        const val = e.target.value;
        setQuery(val);
        if (val.length > 2) {
            setIsSearching(true);
            const data = await searchPlace(val);
            setResults(data);
            setIsSearching(false);
        } else {
            setResults([]);
        }
    };

    return (
        <div className="relative">
            <input
                className="glass-input w-full"
                placeholder={placeholder}
                value={query}
                onChange={handleSearch}
                style={{ color: 'white' }} // Explicitly setting white text for clarity
            />
            {isSearching && (
                <div className="absolute right-3 top-3 text-indigo-400 animate-spin">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
            {results.length > 0 && (
                <div className="absolute z-50 w-full glass-panel bg-slate-900 shadow-2xl rounded-xl mt-2 max-h-60 overflow-y-auto border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.map((place) => (
                        <div
                            key={place.place_id}
                            className="p-4 hover:bg-indigo-500/10 cursor-pointer border-b border-white/5 last:border-none transition-all group"
                            onClick={() => {
                                const shortName = place.display_name.split(',')[0];
                                onSelect({
                                    name: shortName,
                                    lat: parseFloat(place.lat),
                                    lng: parseFloat(place.lon)
                                });
                                setQuery(shortName);
                                setResults([]);
                            }}
                        >
                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm">{place.display_name.split(',')[0]}</p>
                            <p className="text-[10px] text-slate-500 font-medium truncate mt-1">{place.display_name}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default LocationSearch;
