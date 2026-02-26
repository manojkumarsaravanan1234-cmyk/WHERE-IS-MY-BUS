import React, { useState, useEffect, useRef } from 'react';
import socketService from '../services/socket';
import { routeAPI } from '../services/api';

const DriverMode = () => {
    const [status, setStatus] = useState('idle'); // 'idle', 'searching', 'tracking', 'error'
    const [busNumber, setBusNumber] = useState('');
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [foundRoutes, setFoundRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [location, setLocation] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [watchId, setWatchId] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const socket = socketService.connect();

    const handleSearchRoutes = async () => {
        setIsSearching(true);
        setErrorMsg('');
        try {
            const params = {};
            if (source) params.source = source;
            if (destination) params.destination = destination;

            const { data } = await routeAPI.getRoutes(params);
            setFoundRoutes(data);
            if (data.length === 0) {
                setErrorMsg('No routes found. Try searching with just one keyword or check spelling.');
            }
        } catch (err) {
            setErrorMsg('Failed to fetch routes.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleStartJourney = async (route) => {
        if (!busNumber) {
            setErrorMsg('Please enter Bus Registration Number first');
            return;
        }

        setSelectedRoute(route);
        try {
            socket.emit('driver:startJourney', {
                busNumber,
                routeId: route._id,
                driverName: 'Fleet Operator',
            });

            if ('geolocation' in navigator) {
                const id = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude, speed: gpsSpeed, heading } = position.coords;
                        setLocation({ latitude, longitude });
                        setSpeed(gpsSpeed ? (gpsSpeed * 3.6).toFixed(1) : 0);

                        socket.emit('driver:updateLocation', {
                            busNumber,
                            latitude,
                            longitude,
                            speed: gpsSpeed ? gpsSpeed * 3.6 : 0,
                            heading: heading || 0,
                            timestamp: Date.now()
                        });
                    },
                    (err) => {
                        let msg = 'Geolocation Error';
                        if (err.code === 1) {
                            msg = 'Location Access Denied. Please enable GPS and allow location permissions in your browser settings.';
                        } else if (err.code === 2) {
                            msg = 'Position Unavailable. Check your GPS signal.';
                        } else if (err.code === 3) {
                            msg = 'Timeout. Slow location acquisition.';
                        }
                        setErrorMsg(msg);
                        setStatus('error');
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 30000, // Increased to 30s
                        maximumAge: 5000 // Allow 5s old cache
                    }
                );
                setWatchId(id);
                setStatus('tracking');
                setErrorMsg('');
            } else {
                setErrorMsg('Telemetry systems unavailable.');
            }

        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to initialize broadcast');
        }
    };

    const handleStopJourney = () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }

        socket.emit('driver:stopJourney', { busNumber });
        setStatus('idle');
        setLocation(null);
        setSpeed(0);
        setSelectedRoute(null);
    };

    const retryLocation = () => {
        setStatus('idle');
        setErrorMsg('');
        if (selectedRoute) {
            handleStartJourney(selectedRoute);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-1000 ${status === 'tracking' ? 'bg-emerald-600/10' : 'bg-indigo-600/10'}`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-1000 ${status === 'tracking' ? 'bg-indigo-600/10' : 'bg-rose-600/10'}`}></div>

            <div className="w-full max-w-lg z-10 animate-in fade-in zoom-in-95">
                <div className="glass-panel overflow-hidden border-white/5 shadow-2xl">
                    {/* Status Header */}
                    <div className={`p-8 text-center transition-colors duration-700 bg-gradient-to-b ${status === 'tracking' ? 'from-emerald-500/20 to-emerald-500/5' : 'from-indigo-500/20 to-indigo-500/5'}`}>
                        <div className={`w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl transition-all duration-700 ${status === 'tracking' ? 'bg-emerald-500 shadow-emerald-500/40 rotate-12' : 'bg-indigo-600 shadow-indigo-500/40 rotate-0'}`}>
                            {status === 'tracking' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                            {status === 'tracking' ? 'Broadcasting' : 'Operator Mode'}
                        </h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                            {status === 'tracking' ? 'Live Telemetry Active' : 'Initialize Fleet Uplink'}
                        </p>
                    </div>

                    <div className="p-8 md:p-10 space-y-8">
                        {errorMsg && (
                            <div className="alert-glass p-6 rounded-xl text-rose-300 text-sm font-bold border-rose-500/30 flex flex-col items-center gap-4">
                                <span className="uppercase tracking-widest text-xs">! System Error</span>
                                <p className="text-center leading-relaxed font-medium">{errorMsg}</p>
                                {(errorMsg.includes('Location Access Denied') || errorMsg.includes('Timeout')) && (
                                    <button
                                        onClick={retryLocation}
                                        className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 px-6 py-2 rounded-lg text-xs uppercase tracking-widest transition-all"
                                    >
                                        Try Again
                                    </button>
                                )}
                            </div>
                        )}

                        {status === 'idle' ? (
                            <div className="space-y-6">
                                <div className="space-y-5">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Asset ID / Plate</label>
                                        <input
                                            type="text"
                                            placeholder="TN-01-AB-1234"
                                            className="glass-input w-full py-4 uppercase font-mono tracking-widest"
                                            value={busNumber}
                                            onChange={(e) => setBusNumber(e.target.value.toUpperCase())}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Starting Point</label>
                                            <input
                                                type="text"
                                                placeholder="Salem"
                                                className="glass-input w-full py-4 px-4 text-xs"
                                                value={source}
                                                onChange={(e) => setSource(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Destination</label>
                                            <input
                                                type="text"
                                                placeholder="Rasipuram"
                                                className="glass-input w-full py-4 px-4 text-xs"
                                                value={destination}
                                                onChange={(e) => setDestination(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSearchRoutes}
                                    disabled={isSearching}
                                    className="glass-button w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20"
                                >
                                    {isSearching ? 'Scanning Network...' : 'Find Service Path 🔍'}
                                </button>

                                {foundRoutes.length > 0 && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Available Service Paths</p>
                                        <div className="grid gap-3">
                                            {foundRoutes.map(route => (
                                                <button
                                                    key={route._id}
                                                    onClick={() => handleStartJourney(route)}
                                                    className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-emerald-400">ROUTE {route.routeNumber}</span>
                                                            <span className="text-[10px] text-slate-500">• {route.distance}km</span>
                                                        </div>
                                                        <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{route.routeName}</p>
                                                    </div>
                                                    <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">Connect ➜</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Route Info */}
                                <div className="text-center mb-2">
                                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">Active Service</p>
                                    <h3 className="text-xl font-black">{selectedRoute?.routeName}</h3>
                                    <p className="text-xs text-slate-500">Route {selectedRoute?.routeNumber} • Asset {busNumber}</p>
                                </div>

                                {/* Telemetry Panel */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 text-center">
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">Velocity</p>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <p className="text-4xl font-black italic">{Math.round(speed)}</p>
                                            <span className="text-[10px] font-bold text-slate-500">KM/H</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 text-center">
                                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2">Signal</p>
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="flex gap-0.5 items-end h-6">
                                                <div className="w-1 h-2 bg-emerald-500 rounded-full"></div>
                                                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Stable</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Coordinate Lock */}
                                <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 font-mono">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">GPS Metadata</p>
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">LATITUDE</span>
                                            <span className="text-indigo-300 font-bold tracking-widest">{location?.latitude?.toFixed(6) || 'WAITING...'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">LONGITUDE</span>
                                            <span className="text-indigo-300 font-bold tracking-widest">{location?.longitude?.toFixed(6) || 'WAITING...'}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStopJourney}
                                    className="w-full py-4 text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-500/5 rounded-2xl transition-all border border-rose-500/20"
                                >
                                    Deactivate Uplink 🛑
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <p className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">Integrated Telemetry System v2.0</p>
            </div>
        </div>
    );
};

export default DriverMode;
