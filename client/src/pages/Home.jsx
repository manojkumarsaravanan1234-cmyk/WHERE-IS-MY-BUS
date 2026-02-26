import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routeAPI } from '../services/api';

const Home = () => {
    const navigate = useNavigate();
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const { data } = await routeAPI.getRoutes({ source, destination });
            setResults(data);
            setSearched(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="relative z-10 flex flex-col items-center p-6 max-w-6xl mx-auto">
                {/* Header */}
                <header className="w-full flex justify-between items-center py-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-xl font-bold">B</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">WhereIsMyBus</h2>
                    </div>
                    <button
                        onClick={() => navigate('/admin')}
                        className="glass-button-ghost text-sm px-6"
                    >
                        Admin Portal
                    </button>
                </header>

                {/* Hero Section */}
                <div className="w-full mt-12 md:mt-24 text-center">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        Track Your Journey <br />
                        <span className="text-indigo-400 neon-text">In Real-Time.</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                        Experience the next generation of bus tracking. Precise locations, instant updates, and smart arrival alerts.
                    </p>

                    {/* Search Card */}
                    <div className="glass-panel p-8 md:p-10 mb-20 w-full max-w-4xl mx-auto shadow-2xl">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-2 text-left">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-4 flex justify-between">
                                    Starting Point
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if ('geolocation' in navigator) {
                                                setLoading(true);
                                                navigator.geolocation.getCurrentPosition(
                                                    async (pos) => {
                                                        const { latitude, longitude } = pos.coords;
                                                        setSource(`My Location`);
                                                        try {
                                                            const response = await routeAPI.findNearbyRoutes(longitude, latitude);
                                                            setResults(response.data);
                                                            setSearched(true);
                                                        } catch (err) {
                                                            console.error(err);
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    },
                                                    (err) => {
                                                        setLoading(false);
                                                        alert("Location access denied. Please enter manually.");
                                                    }
                                                );
                                            }
                                        }}
                                        className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                                    >
                                        {loading ? 'Detecting...' : 'Auto-detect 📍'}
                                    </button>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter origin..."
                                    className="glass-input w-full py-4 px-6 text-lg"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 space-y-2 text-left">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-4">Destination</label>
                                <input
                                    type="text"
                                    placeholder="Where to?"
                                    className="glass-input w-full py-4 px-6 text-lg"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                />
                            </div>
                            <div className="md:pt-8">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="glass-button w-full md:w-auto px-10 py-4 h-[60px] text-lg"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Find Routes 🚌"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Search Results */}
                {searched && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
                        <div className="flex justify-between items-center mb-8 px-4">
                            <h2 className="text-3xl font-bold">Available Routes</h2>
                            <div className="glass-badge">{results.length} Matches Found</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {results.length > 0 ? (
                                results.map((route) => (
                                    <div
                                        key={route._id}
                                        onClick={() => navigate(`/track/${route._id}`)}
                                        className="glass-card p-8 cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">
                                                Route {route.routeNumber}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Now</span>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold mb-6 group-hover:text-indigo-400 transition-colors">
                                            {route.routeName}
                                        </h3>

                                        <div className="flex flex-wrap gap-4 text-slate-400 text-sm">
                                            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                                                <span className="text-indigo-400">📍</span> {route.stops.length} Stops
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                                                <span className="text-indigo-400">📏</span> {route.distance} km
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                                                <span className="text-indigo-400">⏱️</span> {route.estimatedDuration} mins
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="glass-panel p-16 text-center col-span-full">
                                    <div className="text-5xl mb-6">🔍</div>
                                    <p className="text-2xl font-bold text-slate-300 mb-4">No routes found!</p>
                                    <button
                                        className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
                                        onClick={() => { setSource(''); setDestination(''); handleSearch(); }}
                                    >
                                        Explore all active routes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Section */}
                <div className="w-full mt-auto py-12 text-center border-t border-slate-800/50">
                    <button
                        onClick={() => navigate('/driver')}
                        className="glass-button-ghost group"
                    >
                        Are you a driver? <span className="text-indigo-400 group-hover:ml-2 transition-all">Switch to Driver Mode ➜</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
