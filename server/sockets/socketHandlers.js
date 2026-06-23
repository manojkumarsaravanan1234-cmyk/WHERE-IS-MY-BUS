const Bus = require('../models/Bus');
const Route = require('../models/Route');

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
                let bus = await Bus.findOne({ busNumber: formattedBusNumber });

                if (!bus) {
                    bus = await Bus.create({
                        busNumber: formattedBusNumber,
                        routeId: routeId,
                        isActive: true,
                        driverInfo: { name: driverName, phone: driverPhone, socketId: socket.id },
                        lastUpdated: Date.now()
                    });
                } else {
                    bus = await Bus.findOneAndUpdate(
                        { busNumber: formattedBusNumber },
                        {
                            routeId: routeId,
                            isActive: true,
                            driverInfo: { ...bus.driverInfo, name: driverName, phone: driverPhone, socketId: socket.id },
                            lastUpdated: Date.now()
                        },
                        { new: true }
                    );
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

                console.log(`📍 Location update: Bus ${formattedBusNumber} at [${longitude}, ${latitude}]`);

                // Update in MongoDB
                const bus = await Bus.findOneAndUpdate(
                    { busNumber: formattedBusNumber },
                    {
                        currentLocation: { coordinates: [longitude, latitude], type: 'Point' },
                        speed: speed || 0,
                        heading: heading || 0,
                        lastUpdated: Date.now()
                    },
                    { new: true }
                ).populate('routeId');

                if (!bus) {
                    console.error('❌ DB Update Error during location update: Bus not found');
                    return;
                }

                // Calculate Next Stop if route has stops
                let nextStop = null;
                if (bus.routeId && Array.isArray(bus.routeId.stops) && bus.routeId.stops.length > 0) {
                    let minDistance = Infinity;
                    let closestStop = null;

                    bus.routeId.stops.forEach(stop => {
                        const stopCoords = stop.coordinates?.coordinates;
                        if (Array.isArray(stopCoords) && stopCoords.length >= 2) {
                            const dist = calculateDistance(latitude, longitude, stopCoords[1], stopCoords[0]);
                            if (dist < minDistance) {
                                minDistance = dist;
                                closestStop = stop;
                            }
                        }
                    });

                    nextStop = closestStop;
                }

                const locationUpdate = {
                    busNumber: formattedBusNumber,
                    location: { type: 'Point', coordinates: [longitude, latitude] },
                    speed: Math.round(speed || 0),
                    heading: heading || 0,
                    timestamp: Date.now(),
                    routeId: bus.routeId?._id,
                    routeName: bus.routeId?.routeName,
                    nextStop: nextStop
                };

                // Broadcast
                if (bus.routeId) {
                    io.to(`route:${bus.routeId._id}`).emit('bus:locationUpdate', locationUpdate);
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

                const bus = await Bus.findOneAndUpdate(
                    { busNumber: formattedBusNumber },
                    { isActive: false, lastUpdated: Date.now() },
                    { new: true }
                );

                if (!bus) return;

                activeDrivers.delete(formattedBusNumber);
                socket.leave(`bus:${formattedBusNumber}`);
                if (bus.routeId) {
                    socket.leave(`route:${bus.routeId}`);
                    io.to(`route:${bus.routeId}`).emit('bus:left', {
                        busNumber: formattedBusNumber,
                        routeId: bus.routeId,
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

                const buses = await Bus.find({ routeId: routeId, isActive: true });

                socket.emit('route:activeBuses', {
                    routeId,
                    buses: buses.map(bus => ({
                        busNumber: bus.busNumber,
                        location: bus.currentLocation,
                        speed: bus.speed,
                        heading: bus.heading,
                        lastUpdated: bus.lastUpdated,
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
                    await Bus.findOneAndUpdate(
                        { busNumber: busNumber },
                        { isActive: false, lastUpdated: Date.now() }
                    );
                    activeDrivers.delete(busNumber);
                    break;
                }
            }
            activeUsers.delete(socket.id);
        });
    });

    // Simple cleanup every 5 mins
    setInterval(async () => {
        const staleTime = new Date(Date.now() - 10 * 60 * 1000);
        await Bus.updateMany(
            { lastUpdated: { $lt: staleTime } },
            { isActive: false }
        );
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
