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

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const polylinePath = useMemo(() => {
        if (!routeCoordinates || routeCoordinates.length === 0) return [];
        return routeCoordinates.map(coord => ({
            lat: coord[0],
            lng: coord[1]
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

            // Include user location in bounds
            if (userLocation) {
                bounds.extend(userLocation);
                hasCoordinates = true;
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
                    const lat = bus.location?.coordinates?.[1];
                    const lng = bus.location?.coordinates?.[0];
                    if (lat === undefined || lng === undefined) return null;

                    return (
                        <React.Fragment key={bus.busNumber}>
                            <Marker
                                position={{ lat, lng }}
                                icon={{ ...busIcon, rotation: bus.heading || 0 }}
                                onClick={() => setSelectedBus(bus)}
                            />
                            {/* Proximity Pulse */}
                            <Circle
                                center={{ lat, lng }}
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
                    const coords = stop.coordinates.coordinates || stop.coordinates;
                    return (
                        <Marker
                            key={`stop-${index}`}
                            position={{ lat: coords[1], lng: coords[0] }}
                            icon={{
                                path: map && window.google ? window.google.maps.SymbolPath.CIRCLE : 0,
                                fillColor: "#ffffff",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: "#6366f1",
                                scale: 4,
                            }}
                            title={stop.name}
                        />
                    );
                })}

                {/* Custom Info Window */}
                {selectedBus && (
                    <InfoWindow
                        position={{
                            lat: selectedBus.location.coordinates[1],
                            lng: selectedBus.location.coordinates[0]
                        }}
                        onCloseClick={() => setSelectedBus(null)}
                    >
                        <div className="p-3 bg-slate-900 text-white min-w-[150px]">
                            <h3 className="text-sm font-black uppercase text-indigo-400 mb-2">Bus {selectedBus.busNumber}</h3>
                            <div className="space-y-1 text-[10px] font-bold">
                                <p className="flex justify-between"><span>VELOCITY:</span> <span>{Math.round(selectedBus.speed)} KM/H</span></p>
                                {selectedBus.nextStop && (
                                    <p className="text-emerald-400 mt-2">➜ {selectedBus.nextStop.name}</p>
                                )}
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}

export default React.memo(LiveMap);
