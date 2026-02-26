import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import { routeAPI } from '../services/api';
import { getRoutePolyline } from '../services/mapService';
import LiveMap from '../components/Map/LiveMap';

const LiveView = () => {
    const { routeId } = useParams();
    const navigate = useNavigate();
    const [buses, setBuses] = useState([]);
    const [route, setRoute] = useState(null);
    const [routeGeometry, setRouteGeometry] = useState([]);
    const [loading, setLoading] = useState(true);

    // User Journey State
    const [myBus, setMyBus] = useState(null);
    const [myDropStop, setMyDropStop] = useState(null);
    const [remainingDist, setRemainingDist] = useState(null);
    const [showJourneyModal, setShowJourneyModal] = useState(false);

    // Alarm Settings State
    const [alarmActive, setAlarmActive] = useState(false);
    const [targetStop, setTargetStop] = useState(null);
    const [showAlarmModal, setShowAlarmModal] = useState(false);
    const [alarmDistance, setAlarmDistance] = useState(1.0); // Default 1km
    const [customRingtone, setCustomRingtone] = useState(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    const [userLocation, setUserLocation] = useState(null);

    // Default Alarm Sound
    const audioRef = useRef(new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3'));

    const socket = socketService.connect();

    // Track User's Own Location for the Map
    useEffect(() => {
        if ('geolocation' in navigator) {
            const id = navigator.geolocation.watchPosition(
                (pos) => {
                    setUserLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => console.error("User Tracking Error:", err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(id);
        }
    }, []);

    // Handle File Upload for Ringtone
    const handleRingtoneUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomRingtone(url);
            audioRef.current.src = url; // Update audio source
        }
    };

    const togglePreview = () => {
        if (isPlayingPreview) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlayingPreview(false);
        } else {
            audioRef.current.play().catch(e => console.log("Audio preview failed", e));
            setIsPlayingPreview(true);
            // Stop preview after 5 seconds
            setTimeout(() => {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlayingPreview(false);
            }, 5000);
        }
    };

    // User Location Sharing for Crowdsourcing
    const [userWatchId, setUserWatchId] = useState(null);

    const startUserLocationSharing = (bus) => {
        if ('geolocation' in navigator) {
            const id = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, speed, heading } = position.coords;

                    socket.emit('driver:updateLocation', {
                        busNumber: bus.busNumber,
                        latitude,
                        longitude,
                        speed: speed ? speed * 3.6 : 0,
                        heading: heading || 0,
                        timestamp: Date.now(),
                        isVolunteer: true // Flag to indicate this is a crowdsourced update
                    });
                },
                (err) => {
                    console.error('User Geolocation Error:', err);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
            setUserWatchId(id);
        }
    };

    const stopUserLocationSharing = () => {
        if (userWatchId !== null) {
            navigator.geolocation.clearWatch(userWatchId);
            setUserWatchId(null);
        }
    };

    useEffect(() => {
        if (myBus) {
            startUserLocationSharing(myBus);
        } else {
            stopUserLocationSharing();
        }
        return () => stopUserLocationSharing();
    }, [myBus]);

    useEffect(() => {
        const fetchRouteData = async () => {
            try {
                const response = await routeAPI.getRoute(routeId);
                const routeData = response.data;
                setRoute(routeData);

                if (routeData.source && routeData.destination) {
                    const poly = await getRoutePolyline(
                        routeData.source.coordinates,
                        routeData.destination.coordinates
                    );
                    if (poly && poly.geometry) {
                        const leafletCoords = poly.geometry.coordinates.map(c => [c[1], c[0]]);
                        setRouteGeometry(leafletCoords);
                    }
                }
            } catch (error) {
                console.error('Error fetching route:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRouteData();

        socket.emit('user:trackRoute', { routeId });
        socket.on('route:activeBuses', (data) => setBuses(data.buses));

        socket.on('bus:locationUpdate', (updatedBus) => {
            setBuses((prevBuses) => {
                const index = prevBuses.findIndex((b) => b.busNumber === updatedBus.busNumber);

                if (myBus && myBus.busNumber === updatedBus.busNumber && myDropStop) {
                    const dist = calculateDistance(
                        updatedBus.location.coordinates[1], updatedBus.location.coordinates[0],
                        myDropStop.coordinates.coordinates[1], myDropStop.coordinates.coordinates[0]
                    );
                    setRemainingDist(dist);
                }

                if (alarmActive && targetStop) {
                    checkAlarm(updatedBus, targetStop);
                }

                if (index !== -1) {
                    const newBuses = [...prevBuses];
                    newBuses[index] = { ...newBuses[index], ...updatedBus };
                    return newBuses;
                } else {
                    return [...prevBuses, updatedBus];
                }
            });
        });

        return () => {
            socket.emit('user:stopTracking', { routeId });
            socket.off('route:activeBuses');
            socket.off('bus:locationUpdate');
            stopAlarmSound();
        };
    }, [routeId, alarmActive, targetStop, myBus, myDropStop]);

    // Check Alarm using Custom Distance
    const checkAlarm = (bus, stop) => {
        const dist = calculateDistance(
            bus.location.coordinates[1], bus.location.coordinates[0],
            stop.coordinates.coordinates[1], stop.coordinates.coordinates[0]
        );

        if (dist <= alarmDistance) {
            triggerAlarm(dist);
        }
    };

    const triggerAlarm = (dist) => {
        if ('vibrate' in navigator) navigator.vibrate([1000, 500, 1000]);
        playAlarmSound();
        // Custom animated alert could be added here
        setAlarmActive(false);
    };

    const playAlarmSound = () => {
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.log("Audio play failed", e));
    };

    const stopAlarmSound = () => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAlarmActive(false);
    };

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-950 gap-6">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full blur-[20px] animate-pulse"></div>
                </div>
            </div>
            <p className="text-indigo-400 font-bold tracking-widest uppercase animate-pulse">Locating Active Buses...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden relative font-sans bg-slate-950 text-white">

            {/* Premium Header */}
            <header className="glass-header z-50 px-6 py-4 flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white">
                        ←
                    </div>
                </button>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-indigo-400 font-bold text-sm tracking-widest uppercase">Route</span>
                        <h1 className="text-xl font-extrabold tracking-tight">{route?.routeNumber}</h1>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        {route?.source.name} <span className="text-indigo-500">➜</span> {route?.destination.name}
                    </p>
                </div>

                <button
                    onClick={() => setShowAlarmModal(true)}
                    className={`glass-button text-xs py-2 px-4 ${alarmActive ? 'bg-rose-500 animate-pulse-slow shadow-lg shadow-rose-500/40 border-none' : ''}`}
                >
                    {alarmActive ? '⏰ Alarm Active' : '🔔 Set Alarm'}
                </button>
            </header>

            {/* Map Container - Full occupy */}
            <div className="flex-1 relative">
                <LiveMap
                    buses={buses}
                    routeCoordinates={routeGeometry.length > 0 ? routeGeometry : route?.stops?.map(s => [s.coordinates.coordinates[1], s.coordinates.coordinates[0]])}
                    userLocation={userLocation}
                />
            </div>

            {/* Alarm Ringing Overlay */}
            {audioRef.current.loop && !audioRef.current.paused && (
                <div className="fixed inset-0 z-[200] bg-rose-600/90 flex flex-col items-center justify-center animate-in fade-in">
                    <div className="text-9xl mb-8 animate-bounce">⏰</div>
                    <h2 className="text-4xl font-extrabold mb-2 uppercase tracking-tighter">Wake Up!</h2>
                    <p className="text-lg opacity-80 mb-12">The bus is approaching your destination.</p>
                    <button
                        onClick={stopAlarmSound}
                        className="bg-white text-rose-600 px-12 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:scale-105 transition-transform"
                    >
                        I'M AWAKE 🖐️
                    </button>
                </div>
            )}

            {/* Journey Status Bar */}
            {myBus && myDropStop && (
                <div className="absolute top-24 left-6 right-6 z-30 pointer-events-none">
                    <div className="glass-panel bg-slate-900/40 border-indigo-500/30 p-5 flex justify-between items-center pointer-events-auto">
                        <div>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Estimated Distance</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-4xl font-black tracking-tighter">{remainingDist ? remainingDist.toFixed(1) : '...'}</p>
                                <span className="text-xs font-bold text-slate-500 uppercase">km left</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Off-Boarding at</p>
                            <p className="font-extrabold text-xl leading-tight text-white">{myDropStop.name}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Bus Info Cards */}
            <div className="absolute bottom-6 left-6 right-6 z-20 space-y-4">
                {buses.length === 0 && (
                    <div className="glass-card p-6 text-center text-slate-400 font-medium">
                        🚌 No active buses currently tracking on this route.
                    </div>
                )}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {buses.map(bus => (
                        <div key={bus.busNumber} className="glass-card min-w-[300px] p-6 shrink-0 relative overflow-hidden">
                            {myBus?.busNumber === bus.busNumber && (
                                <div className="absolute top-0 right-0 py-1 px-3 bg-indigo-500 text-[10px] font-bold rounded-bl-xl uppercase tracking-tighter">
                                    Your Ride
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-2xl font-black italic">BUS {bus.busNumber}</h3>
                                        <div className={`w-2 h-2 rounded-full ${bus.speed > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                            {Math.round(bus.speed)} KM/H
                                        </span>
                                    </div>
                                </div>
                                {!myBus ? (
                                    <button
                                        onClick={() => { setMyBus(bus); setShowJourneyModal(true); }}
                                        className="glass-button text-[10px] py-1.5 px-3"
                                    >
                                        I'M ON BOARD 🚌
                                    </button>
                                ) : myBus?.busNumber === bus.busNumber && (
                                    <button
                                        onClick={() => { setMyBus(null); setMyDropStop(null); setRemainingDist(null); }}
                                        className="text-rose-400 text-[10px] font-bold hover:underline"
                                    >
                                        EXIT JOURNEY
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                    <p className="text-xs text-slate-400">Next stop: <span className="text-white font-bold">{bus.nextStop?.name || '---'}</span></p>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 animate-pulse-slow" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Journey Modal - Select Destination */}
            {showJourneyModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="glass-panel bg-slate-900 w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-5">
                        <h3 className="text-3xl font-extrabold mb-2">Arrival Alarm</h3>
                        <p className="text-slate-400 mb-8 text-sm">Select your destination stop to start tracking distance.</p>

                        <div className="space-y-2 max-h-80 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                            {route?.stops?.map((stop, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setMyDropStop(stop); setShowJourneyModal(false); }}
                                    className="w-full text-left p-4 rounded-xl border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex justify-between items-center group"
                                >
                                    <span className="font-bold">{stop.name}</span>
                                    <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-all font-bold">Select ➔</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setShowJourneyModal(false); setMyBus(null); }} className="w-full py-4 text-slate-500 font-bold hover:text-white transition-colors">CANCEL</button>
                    </div>
                </div>
            )}

            {/* Advanced Alarm Modal */}
            {showAlarmModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="glass-panel bg-slate-900 border-indigo-500/20 w-full max-w-sm p-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-black">Alarm</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Notification Settings</p>
                            </div>
                            <button onClick={() => setShowAlarmModal(false)} className="text-slate-500 hover:text-white text-2xl">✕</button>
                        </div>

                        {/* 1. Select Stop */}
                        <div className="mb-8">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">Trigger Location</label>
                            <div className="max-h-40 overflow-y-auto rounded-2xl border border-white/5 bg-slate-950/50 p-1">
                                {route?.stops.length > 0 ? route.stops.map((stop, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setTargetStop(stop)}
                                        className={`w-full text-left p-3 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${targetStop?.name === stop.name ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-400'}`}
                                    >
                                        {stop.name}
                                        {targetStop?.name === stop.name && <span>✓</span>}
                                    </button>
                                )) : <p className="p-3 text-slate-600">No stops available.</p>}
                            </div>
                        </div>

                        {/* 2. Alarm Distance */}
                        <div className="mb-8">
                            <div className="flex justify-between mb-4">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Wake-up distance</label>
                                <span className="text-white font-black">{alarmDistance} km before</span>
                            </div>
                            <input
                                type="range"
                                min="0.1" max="5.0" step="0.1"
                                value={alarmDistance}
                                onChange={(e) => setAlarmDistance(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        {/* 3. Custom Ringtone */}
                        <div className="mb-10">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">Custom Tone 🎵</label>
                            <div className="flex flex-col gap-3">
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleRingtoneUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="glass-input text-xs flex items-center justify-center gap-2 py-4 border-dashed border-2 group-hover:border-indigo-500 transition-colors">
                                        <span className="text-lg">📁</span>
                                        {customRingtone ? 'Ringtone Updated' : 'Upload custom sound...'}
                                    </div>
                                </div>

                                {customRingtone && (
                                    <button
                                        onClick={togglePreview}
                                        className="text-[10px] font-bold text-indigo-400 text-center uppercase tracking-widest py-2 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/10"
                                    >
                                        {isPlayingPreview ? '⏹ Stop Preview' : '▶ Preview Sound'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            disabled={!targetStop}
                            onClick={() => { setAlarmActive(true); setShowAlarmModal(false); }}
                            className={`glass-button w-full py-5 text-lg font-bold shadow-xl shadow-indigo-600/20 ${!targetStop ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                        >
                            Activate Alarm ⏰
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveView;
