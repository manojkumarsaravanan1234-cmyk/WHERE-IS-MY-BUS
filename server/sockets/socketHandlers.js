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
         * Emitted when a driver starts tracking a bus
         * Payload: { busNumber, routeId, driverName, driverPhone }
         */
        socket.on('driver:startJourney', async (data) => {
            try {
                const { busNumber, routeId, driverName, driverPhone } = data;

                console.log(`🚌 Driver starting journey: Bus ${busNumber} on route ${routeId}`);

                // Find or create the bus
                let bus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });

                if (!bus) {
                    // Create new bus if doesn't exist
                    bus = new Bus({
                        busNumber: busNumber.toUpperCase(),
                    });
                }

                // Update driver info
                if (driverName) bus.driverInfo.name = driverName;
                if (driverPhone) bus.driverInfo.phone = driverPhone;

                // Start journey
                await bus.startJourney(routeId, socket.id);

                // Store active driver
                activeDrivers.set(busNumber.toUpperCase(), socket.id);

                // Join a room for this bus (for targeted broadcasting)
                socket.join(`bus:${busNumber.toUpperCase()}`);
                socket.join(`route:${routeId}`);

                // Notify all users tracking this route
                io.to(`route:${routeId}`).emit('bus:joined', {
                    busNumber: bus.busNumber,
                    routeId: bus.routeId,
                    timestamp: Date.now(),
                });

                // Acknowledge to driver
                socket.emit('journey:started', {
                    success: true,
                    busNumber: bus.busNumber,
                    routeId: bus.routeId,
                });

                console.log(`✅ Journey started: Bus ${bus.busNumber}`);
            } catch (error) {
                console.error('❌ Error starting journey:', error);
                socket.emit('error', {
                    message: 'Failed to start journey',
                    error: error.message,
                });
            }
        });

        /**
         * Event: driver:updateLocation
         * Emitted every 5 seconds by the driver app with GPS data
         * Payload: { busNumber, longitude, latitude, speed, heading, accuracy }
         */
        socket.on('driver:updateLocation', async (data) => {
            try {
                const { busNumber, longitude, latitude, speed, heading, accuracy } = data;

                // Validate coordinates
                if (
                    typeof longitude !== 'number' ||
                    typeof latitude !== 'number' ||
                    longitude < -180 ||
                    longitude > 180 ||
                    latitude < -90 ||
                    latitude > 90
                ) {
                    socket.emit('error', { message: 'Invalid coordinates' });
                    return;
                }

                // Find the bus
                const bus = await Bus.findOne({ busNumber: busNumber.toUpperCase() }).populate('routeId');

                if (!bus) {
                    socket.emit('error', { message: 'Bus not found' });
                    return;
                }

                // Update location
                await bus.updateLocation(longitude, latitude, speed || 0, heading || 0);

                // Prepare broadcast data
                const locationUpdate = {
                    busNumber: bus.busNumber,
                    location: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    speed: speed || 0,
                    heading: heading || 0,
                    accuracy: accuracy || null,
                    timestamp: Date.now(),
                    routeId: bus.routeId?._id,
                    routeName: bus.routeId?.routeName,
                };

                // Calculate ETA to next stop (if route exists)
                if (bus.routeId && bus.routeId.stops && bus.routeId.stops.length > 0) {
                    const nextStopIndex = bus.currentStopIndex || 0;
                    if (nextStopIndex < bus.routeId.stops.length) {
                        const nextStop = bus.routeId.stops[nextStopIndex];
                        const distance = calculateDistance(
                            latitude,
                            longitude,
                            nextStop.coordinates.coordinates[1],
                            nextStop.coordinates.coordinates[0]
                        );

                        // ETA in minutes (assuming average speed of 30 km/h if speed is 0)
                        const effectiveSpeed = speed > 5 ? speed : 30;
                        const eta = Math.round((distance / effectiveSpeed) * 60);

                        locationUpdate.nextStop = {
                            name: nextStop.name,
                            distance: distance.toFixed(2), // km
                            eta: eta, // minutes
                        };
                    }
                }

                // Broadcast to all users tracking this route
                if (bus.routeId) {
                    io.to(`route:${bus.routeId._id}`).emit('bus:locationUpdate', locationUpdate);
                }

                // Also broadcast to general bus watchers
                io.to(`bus:${bus.busNumber}`).emit('bus:locationUpdate', locationUpdate);

                // Optional: Log every 10th update to avoid console spam
                if (Math.random() < 0.1) {
                    console.log(
                        `📍 Location update: Bus ${bus.busNumber} at [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`
                    );
                }
            } catch (error) {
                console.error('❌ Error updating location:', error);
                socket.emit('error', {
                    message: 'Failed to update location',
                    error: error.message,
                });
            }
        });

        /**
         * Event: driver:stopJourney
         * Emitted when driver ends the journey
         * Payload: { busNumber }
         */
        socket.on('driver:stopJourney', async (data) => {
            try {
                const { busNumber } = data;

                console.log(`🛑 Driver stopping journey: Bus ${busNumber}`);

                const bus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });

                if (!bus) {
                    socket.emit('error', { message: 'Bus not found' });
                    return;
                }

                const routeId = bus.routeId;

                // Stop journey
                await bus.stopJourney();

                // Remove from active drivers
                activeDrivers.delete(busNumber.toUpperCase());

                // Leave rooms
                socket.leave(`bus:${busNumber.toUpperCase()}`);
                if (routeId) {
                    socket.leave(`route:${routeId}`);

                    // Notify users
                    io.to(`route:${routeId}`).emit('bus:left', {
                        busNumber: bus.busNumber,
                        routeId: routeId,
                        timestamp: Date.now(),
                    });
                }

                socket.emit('journey:stopped', {
                    success: true,
                    busNumber: bus.busNumber,
                });

                console.log(`✅ Journey stopped: Bus ${bus.busNumber}`);
            } catch (error) {
                console.error('❌ Error stopping journey:', error);
                socket.emit('error', {
                    message: 'Failed to stop journey',
                    error: error.message,
                });
            }
        });

        /**
         * USER EVENTS
         */

        /**
         * Event: user:trackRoute
         * Emitted when a user wants to track buses on a specific route
         * Payload: { routeId, userId }
         */
        socket.on('user:trackRoute', async (data) => {
            try {
                const { routeId, userId } = data;

                console.log(`👤 User ${userId || socket.id} tracking route ${routeId}`);

                // Join the route room
                socket.join(`route:${routeId}`);

                // Store user tracking info
                activeUsers.set(socket.id, { routeId, userId });

                // Get all active buses on this route
                const buses = await Bus.find({
                    routeId,
                    isActive: true,
                }).populate('routeId');

                // Send current bus positions to the user
                socket.emit('route:activeBuses', {
                    routeId,
                    buses: buses.map((bus) => ({
                        busNumber: bus.busNumber,
                        location: bus.currentLocation,
                        speed: bus.speed,
                        heading: bus.heading,
                        lastUpdated: bus.lastUpdated,
                    })),
                });

                console.log(`✅ User tracking route ${routeId}, found ${buses.length} active buses`);
            } catch (error) {
                console.error('❌ Error tracking route:', error);
                socket.emit('error', {
                    message: 'Failed to track route',
                    error: error.message,
                });
            }
        });

        /**
         * Event: user:stopTracking
         * Emitted when user stops tracking a route
         * Payload: { routeId }
         */
        socket.on('user:stopTracking', (data) => {
            const { routeId } = data;
            socket.leave(`route:${routeId}`);
            activeUsers.delete(socket.id);
            console.log(`👤 User stopped tracking route ${routeId}`);
        });

        /**
         * DISCONNECT EVENT
         * Handle cleanup when a client disconnects
         */
        socket.on('disconnect', async () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);

            // Check if this was a driver
            for (const [busNumber, socketId] of activeDrivers.entries()) {
                if (socketId === socket.id) {
                    try {
                        const bus = await Bus.findOne({ busNumber });
                        if (bus) {
                            await bus.stopJourney();
                            console.log(`🛑 Auto-stopped journey for bus ${busNumber} due to disconnect`);

                            if (bus.routeId) {
                                io.to(`route:${bus.routeId}`).emit('bus:left', {
                                    busNumber: bus.busNumber,
                                    routeId: bus.routeId,
                                    timestamp: Date.now(),
                                    reason: 'disconnect',
                                });
                            }
                        }
                        activeDrivers.delete(busNumber);
                    } catch (error) {
                        console.error(`❌ Error during disconnect cleanup: ${error.message}`);
                    }
                    break;
                }
            }

            // Remove user tracking
            activeUsers.delete(socket.id);
        });
    });

    // Periodic cleanup of inactive buses (every 5 minutes)
    setInterval(async () => {
        try {
            const staleTime = Date.now() - 10 * 60 * 1000; // 10 minutes ago
            const staleBuses = await Bus.find({
                isActive: true,
                lastUpdated: { $lt: new Date(staleTime) },
            });

            for (const bus of staleBuses) {
                await bus.stopJourney();
                console.log(`🧹 Auto-deactivated stale bus: ${bus.busNumber}`);

                if (bus.routeId) {
                    io.to(`route:${bus.routeId}`).emit('bus:left', {
                        busNumber: bus.busNumber,
                        routeId: bus.routeId,
                        timestamp: Date.now(),
                        reason: 'inactive',
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error in cleanup task:', error);
        }
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log('✅ Socket.io handlers initialized');
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
