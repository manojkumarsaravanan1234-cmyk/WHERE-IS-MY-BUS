import React, { useState } from 'react';
import { searchPlace } from '../services/mapService';

const LocationSearch = ({ placeholder, onSelect, value = '' }) => {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Sync query with external value (useful for clearing)
    React.useEffect(() => {
        setQuery(value);
    }, [value]);

    const handleSearch = async (val) => {
        setQuery(val);
        if (val.length > 2) {
            setIsSearching(true);
            try {
                const data = await searchPlace(val);
                setResults(data);
                setIsSearching(false);

                // If typing exactly matches a result, lock it immediately
                if (data && data.length > 0) {
                    const firstMatch = data[0].display_name.split(',')[0].toLowerCase();
                    if (firstMatch === val.toLowerCase().trim()) {
                        handleSelect(data[0]);
                    }
                }
                return data;
            } catch (err) {
                console.error("Search failed", err);
                setIsSearching(false);
                return [];
            }
        } else {
            setResults([]);
            return [];
        }
    };

    const handleSelect = (place) => {
        const shortName = place.display_name.split(',')[0];
        onSelect({
            name: shortName,
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
        });
        setQuery(shortName);
        setResults([]);
    };

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter' && query.length > 2) {
            e.preventDefault();
            const data = results.length > 0 ? results : await handleSearch(query);
            if (data && data.length > 0) {
                handleSelect(data[0]);
            }
        }
    };

    const handleBlur = () => {
        // Delay selection to allow manual clicks, but ensure something is picked if user moves on
        setTimeout(() => {
            // Check results again - if results exist and we haven't locked a value yet
            if (results.length > 0 && !value) {
                handleSelect(results[0]);
            }
            setResults([]);
        }, 500); // 500ms safety buffer
    };

    return (
        <div className="relative">
            <div className="relative">
                <input
                    className={`glass-input w-full ${value ? 'border-emerald-500/50' : ''}`}
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    style={{ color: 'white' }}
                />
                {value && (
                    <div className="absolute right-3 top-3 text-emerald-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                )}
            </div>
            {isSearching && (
                <div className="absolute right-3 top-3 text-indigo-400 animate-spin">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
            {isSearching && results.length === 0 && (
                <div className="absolute z-50 w-full glass-panel bg-slate-900 shadow-2xl rounded-xl mt-2 p-4 border border-white/10 animate-in fade-in duration-200">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] animate-pulse text-center">Scanning Tamil Nadu Grid...</p>
                </div>
            )}
            {results.length > 0 && (
                <div className="absolute z-50 w-full glass-panel bg-slate-900 shadow-2xl rounded-xl mt-2 max-h-60 overflow-y-auto border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.map((place) => (
                        <div
                            key={place.place_id}
                            className="p-4 hover:bg-indigo-500/10 cursor-pointer border-b border-white/5 last:border-none transition-all group"
                            onClick={() => handleSelect(place)}
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
