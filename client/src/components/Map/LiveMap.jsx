import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow, Circle } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 13.0827,
    lng: 80.2707
};

// Premium Futuristic Dark Theme
const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
        { "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#4b5563" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#020617" }] },
        { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#334155" }] },
        { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
        { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
        { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#334155" }] },
        { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#020617" }] },
        { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
        { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
        { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
        { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
        { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#334155" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
        { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#020617" }] }
    ]
};

const LiveMap = ({ buses, userLocation, routeCoordinates, stops }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
        libraries: ['places', 'geometry']
    });

    const [map, setMap] = useState(null);
    const [selectedBus, setSelectedBus] = useState(null);
    const [selectedStop, setSelectedStop] = useState(null);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const polylinePath = useMemo(() => {
        if (!routeCoordinates || routeCoordinates.length === 0) return [];
        return routeCoordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0]
        }));
    }, [routeCoordinates]);

    useEffect(() => {
        if (map && isLoaded && window.google) {
            const bounds = new window.google.maps.LatLngBounds();
            let hasCoordinates = false;

            // Include route coordinates in bounds
            if (polylinePath.length > 0) {
                polylinePath.forEach(point => bounds.extend(point));
                hasCoordinates = true;
            }

            // Include bus locations in bounds
            if (buses && buses.length > 0) {
                buses.forEach(bus => {
                    const lat = bus.location?.coordinates?.[1];
                    const lng = bus.location?.coordinates?.[0];
                    if (lat !== undefined && lng !== undefined) {
                        bounds.extend({ lat, lng });
                        hasCoordinates = true;
                    }
                });
            }

            // Include stops in bounds
            if (stops && stops.length > 0) {
                stops.forEach(stop => {
                    const coords = stop.coordinates.coordinates || stop.coordinates;
                    if (coords && coords.length === 2) {
                        bounds.extend({ lat: coords[1], lng: coords[0] });
                        hasCoordinates = true;
                    }
                });
            }

            if (hasCoordinates) {
                map.fitBounds(bounds, { top: 100, bottom: 200, left: 50, right: 50 });
                // If only one bus or specific location, don't zoom out too much
                const listener = window.google.maps.event.addListener(map, "idle", () => {
                    const currentZoom = map.getZoom();
                    if (currentZoom > 16) map.setZoom(16);
                    if (currentZoom < 10) map.setZoom(12); // Prevent extreme zoom out
                    window.google.maps.event.removeListener(listener);
                });
            } else if (buses && buses.length > 0) {
                // Fallback: center on first bus if no bounds but buses exist
                const firstBus = buses[0];
                const lat = firstBus.location?.coordinates?.[1];
                const lng = firstBus.location?.coordinates?.[0];
                if (lat && lng) map.setCenter({ lat, lng });
            }
        }
    }, [map, isLoaded, polylinePath, buses, userLocation]);

    if (loadError) return (
        <div className="h-full flex items-center justify-center bg-slate-950 p-10 text-center">
            <div className="alert-glass p-8 rounded-3xl max-w-sm">
                <p className="text-3xl mb-4">🛰️</p>
                <h3 className="text-xl font-bold text-white mb-2">Satellite Sync Failed</h3>
                <p className="text-slate-500 text-sm">Check connection or API key.</p>
            </div>
        </div>
    );

    if (!isLoaded) return <div className="h-full flex items-center justify-center bg-slate-950 font-bold text-slate-500 tracking-widest uppercase">Initializing Grid...</div>;

    const busIcon = {
        path: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
        fillColor: "#6366f1",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#ffffff",
        scale: 1.6,
        anchor: map && window.google ? new window.google.maps.Point(12, 12) : null
    };

    const userIcon = {
        path: map && window.google ? window.google.maps.SymbolPath.CIRCLE : 0,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeWeight: 4,
        strokeColor: "#ffffff",
        scale: 10,
    };

    return (
        <div className="h-full w-full relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
            >
                {/* User Location Marker */}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={userIcon}
                        zIndex={10}
                    />
                )}

                {/* Center on Me Button */}
                {userLocation && (
                    <button
                        onClick={() => map?.panTo(userLocation)}
                        className="absolute bottom-40 right-4 z-50 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-indigo-500 transition-all border-2 border-white/20"
                        title="Center on me"
                    >
                        <span className="text-xl">🎯</span>
                    </button>
                )}

                {/* Glow Route Line */}
                {polylinePath.length > 0 && (
                    <Polyline
                        path={polylinePath}
                        options={{
                            strokeColor: "#6366f1",
                            strokeOpacity: 0.2,
                            strokeWeight: 10,
                        }}
                    />
                )}

                {/* Sharp Route Line */}
                {polylinePath.length > 0 && (
                    <Polyline
                        path={polylinePath}
                        options={{
                            strokeColor: "#6366f1",
                            strokeOpacity: 0.8,
                            strokeWeight: 3,
                        }}
                    />
                )}

                {/* Bus Markers */}
                {buses.map((bus) => {
                    // Support both bus.location and bus.current_location (backend/supabase alias)
                    const locData = bus.location || bus.current_location;
                    const coords = locData?.coordinates || locData;
                    const lat = Array.isArray(coords) ? coords[1] : coords?.lat;
                    const lng = Array.isArray(coords) ? coords[0] : coords?.lng;
                    
                    if (lat === undefined || lng === undefined || lat === null || lng === null) return null;

                    return (
                        <React.Fragment key={bus.busNumber}>
                            <Marker
                                position={{ lat: Number(lat), lng: Number(lng) }}
                                icon={{ ...busIcon, rotation: bus.heading || 0 }}
                                onClick={() => setSelectedBus(bus)}
                            />
                            {/* Proximity Pulse */}
                            <Circle
                                center={{ lat: Number(lat), lng: Number(lng) }}
                                radius={150}
                                options={{
                                    strokeColor: "#6366f1",
                                    strokeOpacity: 0.8,
                                    strokeWeight: 1,
                                    fillColor: "#6366f1",
                                    fillOpacity: 0.15,
                                    clickable: false,
                                    zIndex: 1
                                }}
                            />
                        </React.Fragment>
                    );
                })}

                {/* Stop Markers */}
                {stops && stops.map((stop, index) => {
                    // Robust coordinate extraction
                    const coordsObj = stop.coordinates?.coordinates || stop.coordinates;
                    let lat, lng;
                    
                    if (Array.isArray(coordsObj)) {
                        lng = coordsObj[0];
                        lat = coordsObj[1];
                    } else if (coordsObj && typeof coordsObj === 'object') {
                        lat = coordsObj.lat;
                        lng = coordsObj.lng;
                    }

                    if (lat === undefined || lng === undefined || lat === null || lng === null) return null;

                    return (
                        <Marker
                            key={`stop-${index}`}
                            position={{ lat: Number(lat), lng: Number(lng) }}
                            icon={{
                                path: map && window.google ? window.google.maps.SymbolPath.CIRCLE : 0,
                                fillColor: "#ffffff",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: "#6366f1",
                                scale: 6,
                            }}
                            title={stop.name}
                            onClick={() => {
                                setSelectedStop({
                                    ...stop,
                                    lat: Number(lat),
                                    lng: Number(lng)
                                });
                                setSelectedBus(null);
                            }}
                        />
                    );
                })}

                {/* Stop Info Window with Image */}
                {selectedStop && (
                    <InfoWindow
                        position={{ lat: selectedStop.lat, lng: selectedStop.lng }}
                        onCloseClick={() => setSelectedStop(null)}
                    >
                        <div className="p-0 bg-slate-900 overflow-hidden rounded-lg min-w-[200px] max-w-[250px] border border-white/10 shadow-2xl">
                            <div className="relative h-32 w-full bg-slate-800">
                                <img
                                    src={`https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${selectedStop.lat},${selectedStop.lng}&key=${apiKey}`}
                                    alt={selectedStop.name}
                                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60"></div>
                                <div className="absolute bottom-2 left-3">
                                    <h3 className="text-sm font-black text-white uppercase tracking-tighter truncate w-40">{selectedStop.name}</h3>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-950">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Location Detail</p>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${selectedStop.lat},${selectedStop.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    OPEN IN GOOGLE MAPS ➔
                                </a>
                            </div>
                        </div>
                    </InfoWindow>
                )}

                {/* Custom Bus Info Window */}
                {selectedBus && (
                    <InfoWindow
                        position={{
                            lat: selectedBus.location.coordinates[1],
                            lng: selectedBus.location.coordinates[0]
                        }}
                        onCloseClick={() => setSelectedBus(null)}
                    >
                        <div className="p-0 bg-slate-900 overflow-hidden rounded-lg min-w-[200px] border border-white/10">
                            <div className="p-4 bg-slate-950">
                                <h3 className="text-sm font-black uppercase text-indigo-400 mb-3 flex items-center gap-2">
                                    <span className="text-lg">🚌</span> Bus {selectedBus.busNumber}
                                </h3>
                                <div className="space-y-2 text-[10px] font-bold text-slate-300">
                                    <p className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-slate-500 uppercase">VELOCITY</span>
                                        <span>{Math.round(selectedBus.speed)} KM/H</span>
                                    </p>
                                    {selectedBus.nextStop && (
                                        <p className="text-emerald-400 py-1 uppercase italic">➜ {selectedBus.nextStop.name}</p>
                                    )}
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${selectedBus.location.coordinates[1]},${selectedBus.location.coordinates[0]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 block w-full text-center py-2 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black uppercase tracking-widest rounded-md transition-all border border-white/5"
                                >
                                    TRACK IN GOOGLE MAPS
                                </a>
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}

export default React.memo(LiveMap);
