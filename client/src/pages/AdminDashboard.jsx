import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { routeAPI, busAPI } from '../services/api';
import LocationSearch from '../components/LocationSearch';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('routes');
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);

    const [newRoute, setNewRoute] = useState({
        routeName: '',
        routeNumber: '',
        source: { name: '', lat: '', lng: '' },
        destination: { name: '', lat: '', lng: '' },
    });
    const [newBus, setNewBus] = useState({ busNumber: '', routeId: '' });
    const [status, setStatus] = useState({ type: '', message: '' });

    // "Smart Fill" logic: Detects pattern "City1 to City2" and auto-fills coordinates
    useEffect(() => {
        const routeLower = newRoute.routeName.toLowerCase();
        if (routeLower.includes(' to ')) {
            const parts = routeLower.split(' to ');
            const src = parts[0].trim();
            const dest = parts[1].trim();

            const presets = {
                'salem': { name: 'Salem, Tamil Nadu', lat: 11.6643, lng: 78.1460 },
                'rasipuram': { name: 'Rasipuram, Tamil Nadu', lat: 11.4589, lng: 78.1722 },
                'chennai': { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
                'tambaram': { name: 'Tambaram, Chennai', lat: 12.9229, lng: 80.1275 },
                'central': { name: 'Chennai Central', lat: 13.0818, lng: 80.2722 },
                'airport': { name: 'Chennai Airport', lat: 12.9941, lng: 80.1709 }
            };

            if (presets[src] && presets[dest]) {
                setNewRoute(prev => ({
                    ...prev,
                    source: presets[src],
                    destination: presets[dest]
                }));
            }
        }
    }, [newRoute.routeName]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const routesRes = await routeAPI.getRoutes();
            setRoutes(routesRes.data);
            const busesRes = await busAPI.getBuses();
            setBuses(busesRes.data);
        } catch (error) {
            console.error("Error loading data", error);
        }
    };

    const handleCreateRoute = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Syncing to network...' });

        try {
            const payload = {
                routeName: newRoute.routeName,
                routeNumber: newRoute.routeNumber,
                source: {
                    name: newRoute.source.name,
                    coordinates: [parseFloat(newRoute.source.lng), parseFloat(newRoute.source.lat)]
                },
                destination: {
                    name: newRoute.destination.name,
                    coordinates: [parseFloat(newRoute.destination.lng), parseFloat(newRoute.destination.lat)]
                },
                stops: []
            };

            await routeAPI.createRoute(payload);
            setStatus({ type: 'success', message: 'Route Matrix Initialized! ⚡' });
            fetchData();
            setNewRoute({
                routeName: '', routeNumber: '',
                source: { name: '', lat: '', lng: '' },
                destination: { name: '', lat: '', lng: '' },
            });
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.message || 'Initialization failed' });
        }
    };

    const handleDecommission = async (e, id) => {
        e.stopPropagation(); // Prevents navigating to tracking page
        if (!window.confirm('Are you sure you want to decommission this route?')) return;

        try {
            const response = await routeAPI.deleteRoute(id);
            setStatus({ type: 'success', message: response.message || 'Route decommissioned successfully. 🏁' });
            fetchData();
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to decommission route.' });
        }
    };

    const handleRegisterBus = async (e) => {
        e.preventDefault();
        try {
            await busAPI.createBus({
                busNumber: newBus.busNumber,
                routeId: newBus.routeId || null
            });
            setStatus({ type: 'success', message: 'Asset Registered to Fleet! 🚌' });
            fetchData();
            setNewBus({ busNumber: '', routeId: '' });
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.message || 'Registration failed' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 font-sans relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[120px]"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic neon-text">Command Center</h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-2">Fleet & Network Management</p>
                    </div>
                    <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                        <button
                            onClick={() => setActiveTab('routes')}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'routes' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Network
                        </button>
                        <button
                            onClick={() => setActiveTab('buses')}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'buses' ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Assets
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            import('../services/auth').then(auth => {
                                auth.default.logout();
                                navigate('/login');
                            });
                        }}
                        className="glass-button-ghost text-[10px] px-6 py-3 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                    >
                        LOGOUT
                    </button>
                </header>

                {status.message && (
                    <div className={`mb-10 p-5 rounded-2xl border backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 flex justify-between items-center ${status.type === 'error' ? 'alert-glass text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                        <div className="flex items-center gap-4">
                            <span className="text-xl">{status.type === 'error' ? '❌' : '⚡'}</span>
                            <span className="font-bold uppercase text-xs tracking-widest">{status.message}</span>
                        </div>
                        <button onClick={() => setStatus({ type: '', message: '' })} className="opacity-50 hover:opacity-100">✕</button>
                    </div>
                )}

                {activeTab === 'routes' ? (
                    <div className="grid lg:grid-cols-12 gap-10">
                        {/* Create Route Form */}
                        <div className="lg:col-span-4">
                            <div className="glass-panel p-8 sticky top-10 border-white/5">
                                <h2 className="text-2xl font-black mb-1">New Path</h2>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Define Route Coordinates</p>

                                <form onSubmit={handleCreateRoute} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Route Descriptor</label>
                                        <input
                                            className="glass-input w-full"
                                            placeholder="e.g. Velocity line"
                                            value={newRoute.routeName}
                                            onChange={e => setNewRoute({ ...newRoute, routeName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Serial ID</label>
                                        <input
                                            className="glass-input w-full"
                                            placeholder="e.g. 21G"
                                            value={newRoute.routeNumber}
                                            onChange={e => setNewRoute({ ...newRoute, routeNumber: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1 mb-3 block">Origin Search</label>
                                        <LocationSearch
                                            placeholder="Search source..."
                                            onSelect={(loc) => setNewRoute({ ...newRoute, source: { ...loc } })}
                                        />
                                        {newRoute.source.name && (
                                            <div className="mt-3 text-[10px] font-mono text-indigo-300 bg-indigo-500/10 p-2 rounded">
                                                Locked: {newRoute.source.name.substring(0, 30)}...
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1 mb-3 block">Host Search</label>
                                        <LocationSearch
                                            placeholder="Search destination..."
                                            onSelect={(loc) => setNewRoute({ ...newRoute, destination: { ...loc } })}
                                        />
                                        {newRoute.destination.name && (
                                            <div className="mt-3 text-[10px] font-mono text-rose-300 bg-rose-500/10 p-2 rounded">
                                                Locked: {newRoute.destination.name.substring(0, 30)}...
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        disabled={!newRoute.source.lat || !newRoute.destination.lat}
                                        className={`glass-button w-full py-5 mt-6 text-sm font-black uppercase tracking-widest ${(!newRoute.source.lat || !newRoute.destination.lat) ? 'opacity-30 cursor-not-allowed grayscale' : 'shadow-xl shadow-indigo-600/20'}`}
                                    >
                                        Configure Route
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List Routes */}
                        <div className="lg:col-span-8">
                            <h2
                                onClick={() => navigate('/')}
                                className="text-xl font-bold mb-6 flex items-center gap-3 cursor-pointer group w-fit"
                            >
                                <span className="w-1 h-6 bg-indigo-500 rounded-full group-hover:bg-indigo-400 transition-colors"></span>
                                <span className="group-hover:text-indigo-400 transition-colors">Active Grid ({routes.length})</span>
                                <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-400 font-black uppercase tracking-widest">View Public Grid ➔</span>
                            </h2>
                            <div className="grid gap-4">
                                {routes.map(route => (
                                    <div
                                        key={route._id}
                                        onClick={() => navigate(`/track/${route._id}`)}
                                        className="glass-card p-6 flex flex-col md:flex-row justify-between items-center group gap-6 cursor-pointer hover:border-indigo-500/50"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="bg-white text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase">{route.routeNumber || route.route_number || 'N/A'}</span>
                                                <h3 className="font-extrabold text-xl tracking-tight group-hover:text-indigo-400 transition-colors">{route.routeName || route.route_name || 'Unnamed Route'}</h3>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-indigo-400">📍</span>
                                                    <span className="text-xs font-bold text-slate-400">{route.source.name}</span>
                                                </div>
                                                <div className="text-slate-700">➜</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-rose-400">🏁</span>
                                                    <span className="text-xs font-bold text-slate-400">{route.destination.name}</span>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-[9px] font-mono text-slate-600 bg-black/20 p-1 px-2 rounded inline-block">ID: {route._id}</p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDecommission(e, route._id)}
                                            className="text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 px-4 py-2 rounded-xl transition-all border border-rose-500/20 z-10"
                                        >
                                            Decommission
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-12 gap-10">
                        {/* Register Bus Form */}
                        <div className="lg:col-span-4">
                            <div className="glass-panel p-8 sticky top-10 border-white/5">
                                <h2 className="text-2xl font-black mb-1">Asset Registration</h2>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Add to Active Fleet</p>

                                <form onSubmit={handleRegisterBus} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Registration Plate</label>
                                        <input
                                            className="glass-input w-full"
                                            placeholder="e.g. TN-01-AB-1234"
                                            value={newBus.busNumber}
                                            onChange={e => setNewBus({ ...newBus, busNumber: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Network Assignment</label>
                                        <select
                                            className="glass-input w-full bg-slate-900"
                                            value={newBus.routeId}
                                            onChange={e => setNewBus({ ...newBus, routeId: e.target.value })}
                                        >
                                            <option value="">Standby Mode</option>
                                            {routes.map(r => (
                                                <option key={r._id || r.id} value={r._id || r.id} className="bg-slate-900 text-white">
                                                    {(r.routeNumber || r.route_number || 'N/A')} - {(r.routeName || r.route_name || 'Unnamed')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="glass-button w-full py-5 mt-6 from-rose-500 to-rose-700 shadow-xl shadow-rose-600/20 text-sm font-black uppercase tracking-widest">
                                        Register Asset
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List Buses */}
                        <div className="lg:col-span-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-1 h-6 bg-rose-500 rounded-full"></span>
                                Fleet Status ({buses.length})
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {buses.map(bus => (
                                    <div key={bus._id} className="glass-card p-6 relative overflow-hidden group">
                                        <div className={`absolute top-0 right-0 py-1.5 px-4 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${bus.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                            {bus.isActive ? 'Online' : 'Standby'}
                                        </div>
                                        <h3 className="font-black text-2xl tracking-tighter mb-1 mt-2">{bus.busNumber}</h3>
                                        <p
                                            onClick={() => (bus.routeId || bus.routes) && setActiveTab('routes')}
                                            className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${(bus.routeId || bus.routes) ? 'text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors' : 'text-slate-500'}`}
                                        >
                                            {(bus.routeId || bus.routes)
                                                ? `Route: ${(bus.routeId?.routeNumber || bus.routeId?.route_number || bus.routes?.route_number || 'Unknown')}`
                                                : 'Unassigned'}
                                        </p>
                                        {bus.isActive && (
                                            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-xs font-mono text-slate-400">Telemetry: {Math.round(bus.speed)} km/h</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
