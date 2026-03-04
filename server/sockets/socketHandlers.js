const { supabase } = require('../config/database');

/**
 * Socket.io Event Handlers
 * Handles real-time communication between drivers and users
 */

module.exports = (io) => {
    // Store active connections
    const activeDrivers = new Map(); // busNumber -> socketId
    const activeUsers = new Map(); // socketId -> { routeId, userId }

    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        /**
         * DRIVER EVENTS
         */

        /**
         * Event: driver:startJourney
         * Payload: { busNumber, routeId, driverName, driverPhone }
         */
        socket.on('driver:startJourney', async (data) => {
            try {
                const { busNumber, routeId, driverName, driverPhone } = data;
                const formattedBusNumber = busNumber.toUpperCase();

                console.log(`🚌 Driver starting journey: Bus ${formattedBusNumber} on route ${routeId}`);

                // Update or Insert bus
                const { data: busData, error: findError } = await supabase
                    .from('buses')
                    .select('*')
                    .eq('bus_number', formattedBusNumber)
                    .single();

                let result;
                if (!busData) {
                    const { data: insertData, error: insertError } = await supabase
                        .from('buses')
                        .insert([
                            {
                                bus_number: formattedBusNumber,
                                route_id: routeId,
                                is_active: true,
                                driver_info: { name: driverName, phone: driverPhone, socketId: socket.id },
                                last_updated: new Date().toISOString()
                            }
                        ])
                        .select()
                        .single();
                    if (insertError) throw insertError;
                    result = insertData;
                } else {
                    const { data: updateData, error: updateError } = await supabase
                        .from('buses')
                        .update({
                            route_id: routeId,
                            is_active: true,
                            driver_info: { ...busData.driver_info, name: driverName, phone: driverPhone, socketId: socket.id },
                            last_updated: new Date().toISOString()
                        })
                        .eq('bus_number', formattedBusNumber)
                        .select()
                        .single();
                    if (updateError) throw updateError;
                    result = updateData;
                }

                // Store active driver
                activeDrivers.set(formattedBusNumber, socket.id);

                // Join rooms
                socket.join(`bus:${formattedBusNumber}`);
                socket.join(`route:${routeId}`);

                // Notify users
                io.to(`route:${routeId}`).emit('bus:joined', {
                    busNumber: formattedBusNumber,
                    routeId: routeId,
                    timestamp: Date.now(),
                });

                // Acknowledge
                socket.emit('journey:started', {
                    success: true,
                    busNumber: formattedBusNumber,
                    routeId: routeId,
                });

                console.log(`✅ Journey started: Bus ${formattedBusNumber}`);
            } catch (error) {
                console.error('❌ Error starting journey:', error);
                socket.emit('error', { message: 'Failed to start journey', error: error.message });
            }
        });

        /**
         * Event: driver:updateLocation
         * Payload: { busNumber, longitude, latitude, speed, heading }
         */
        socket.on('driver:updateLocation', async (data) => {
            try {
                const { busNumber, longitude, latitude, speed, heading } = data;
                const formattedBusNumber = busNumber.toUpperCase();

                // Simple validation
                if (typeof longitude !== 'number' || typeof latitude !== 'number') return;

                // Update in Supabase
                const { data: bus, error } = await supabase
                    .from('buses')
                    .update({
                        current_location: { coordinates: [longitude, latitude] },
                        speed: speed || 0,
                        heading: heading || 0,
                        last_updated: new Date().toISOString()
                    })
                    .eq('bus_number', formattedBusNumber)
                    .select('*, routes(*)')
                    .single();

                if (error || !bus) return;

                // Calculate Next Stop if route has stops
                let nextStop = null;
                if (bus.routes && Array.isArray(bus.routes.stops) && bus.routes.stops.length > 0) {
                    // Find the stop that has the smallest order but is ahead of the bus?
                    // Or just find the closest stop. For simplicity and robustness, 
                    // we find the stop with the smallest order whose coordinates are "after" the bus
                    // but since routes can be complex, let's find the closest stop that isn't the one we just passed.

                    let minDistance = Infinity;
                    let closestStop = null;

                    bus.routes.stops.forEach(stop => {
                        const stopCoords = stop.coordinates.coordinates || stop.coordinates;
                        const dist = calculateDistance(latitude, longitude, stopCoords[1], stopCoords[0]);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestStop = stop;
                        }
                    });

                    nextStop = closestStop;
                }

                const locationUpdate = {
                    busNumber: formattedBusNumber,
                    location: { type: 'Point', coordinates: [longitude, latitude] },
                    speed: speed || 0,
                    heading: heading || 0,
                    timestamp: Date.now(),
                    routeId: bus.route_id,
                    routeName: bus.routes?.route_name,
                    nextStop: nextStop
                };

                // Broadcast
                if (bus.route_id) {
                    io.to(`route:${bus.route_id}`).emit('bus:locationUpdate', locationUpdate);
                }
                io.to(`bus:${formattedBusNumber}`).emit('bus:locationUpdate', locationUpdate);

            } catch (error) {
                console.error('❌ Error updating location:', error);
            }
        });

        /**
         * Event: driver:stopJourney
         */
        socket.on('driver:stopJourney', async (data) => {
            try {
                const { busNumber } = data;
                const formattedBusNumber = busNumber.toUpperCase();

                const { data: bus, error } = await supabase
                    .from('buses')
                    .update({ is_active: false, last_updated: new Date().toISOString() })
                    .eq('bus_number', formattedBusNumber)
                    .select()
                    .single();

                if (error || !bus) return;

                activeDrivers.delete(formattedBusNumber);
                socket.leave(`bus:${formattedBusNumber}`);
                if (bus.route_id) {
                    socket.leave(`route:${bus.route_id}`);
                    io.to(`route:${bus.route_id}`).emit('bus:left', {
                        busNumber: formattedBusNumber,
                        routeId: bus.route_id,
                        timestamp: Date.now(),
                    });
                }

                socket.emit('journey:stopped', { success: true, busNumber: formattedBusNumber });
            } catch (error) {
                console.error('❌ Error stopping journey:', error);
            }
        });

        /**
         * USER EVENTS
         */
        socket.on('user:trackRoute', async (data) => {
            try {
                const { routeId, userId } = data;
                socket.join(`route:${routeId}`);
                activeUsers.set(socket.id, { routeId, userId });

                const { data: buses, error } = await supabase
                    .from('buses')
                    .select('*')
                    .eq('route_id', routeId)
                    .eq('is_active', true);

                if (error) throw error;

                socket.emit('route:activeBuses', {
                    routeId,
                    buses: buses.map(bus => ({
                        busNumber: bus.bus_number,
                        location: bus.current_location,
                        speed: bus.speed,
                        heading: bus.heading,
                        lastUpdated: bus.last_updated,
                    })),
                });
            } catch (error) {
                console.error('❌ Error tracking route:', error);
            }
        });

        socket.on('user:stopTracking', (data) => {
            socket.leave(`route:${data.routeId}`);
            activeUsers.delete(socket.id);
        });

        /**
         * DISCONNECT
         */
        socket.on('disconnect', async () => {
            for (const [busNumber, socketId] of activeDrivers.entries()) {
                if (socketId === socket.id) {
                    await supabase
                        .from('buses')
                        .update({ is_active: false, last_updated: new Date().toISOString() })
                        .eq('bus_number', busNumber);
                    activeDrivers.delete(busNumber);
                    break;
                }
            }
            activeUsers.delete(socket.id);
        });
    });

    // Simple cleanup every 5 mins
    setInterval(async () => {
        const staleTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        await supabase
            .from('buses')
            .update({ is_active: false })
            .lt('last_updated', staleTime);
    }, 5 * 60 * 1000);
};

/**
 * Helper function to calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRad(degrees) {
    return (degrees * Math.PI) / 180;
}
