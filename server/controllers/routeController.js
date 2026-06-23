const Route = require('../models/Route');
const Bus = require('../models/Bus');

/**
 * @desc    Get all routes or search by source/destination
 * @route   GET /api/routes
 * @query   ?source=Chennai&destination=Bangalore
 * @access  Public
 */
exports.getAllRoutes = async (req, res) => {
    try {
        const { source, destination } = req.query;
        let query = {};

        // Use active filter for general searches
        if (source || destination) {
            query.isActive = true;
        }

        // Search logic
        if (source && destination) {
            const sRegex = new RegExp(source, 'i');
            const dRegex = new RegExp(destination, 'i');
            query.$or = [
                { routeName: { $regex: sRegex } },
                { routeName: { $regex: dRegex } },
                { $and: [{ 'source.name': { $regex: sRegex } }, { 'destination.name': { $regex: dRegex } }] }
            ];
        } else if (source) {
            const sRegex = new RegExp(source, 'i');
            query.$or = [
                { routeName: { $regex: sRegex } },
                { 'source.name': { $regex: sRegex } },
                { 'destination.name': { $regex: sRegex } }
            ];
        } else if (destination) {
            const dRegex = new RegExp(destination, 'i');
            query.$or = [
                { routeName: { $regex: dRegex } },
                { 'source.name': { $regex: dRegex } },
                { 'destination.name': { $regex: dRegex } }
            ];
        }

        const data = await Route.find(query).sort('routeNumber');

        res.status(200).json({
            success: true,
            count: data.length,
            data: data,
        });
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching routes',
            error: error.message,
        });
    }
};

/**
 * @desc    Get single route by ID
 * @route   GET /api/routes/:id
 * @access  Public
 */
exports.getRouteById = async (req, res) => {
    try {
        const data = await Route.findById(req.params.id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        res.status(200).json({
            success: true,
            data: data,
        });
    } catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching route',
            error: error.message,
        });
    }
};

/**
 * @desc    Create a new route (Admin function)
 * @route   POST /api/routes
 * @access  Private/Admin
 */
exports.createRoute = async (req, res) => {
    try {
        const { routeName, routeNumber, source, destination, stops, distance } = req.body;

        if (!routeName || !routeNumber || !source || !destination) {
            return res.status(400).json({
                success: false,
                message: 'Please provide routeName, routeNumber, source, and destination',
            });
        }

        const formattedRouteNumber = String(routeNumber).toUpperCase();

        const insertData = {
            routeName,
            routeNumber: formattedRouteNumber,
            source: {
                name: source.name,
                coordinates: { type: 'Point', coordinates: source.coordinates }
            },
            destination: {
                name: destination.name,
                coordinates: { type: 'Point', coordinates: destination.coordinates }
            },
            stops: Array.isArray(stops) ? stops.map(s => ({
                name: s.name,
                coordinates: { type: 'Point', coordinates: s.coordinates },
                order: s.order
            })) : [],
            distance: distance || 0,
            isActive: true
        };

        const existingRoute = await Route.findOne({ routeNumber: formattedRouteNumber });
        if (existingRoute) {
             return res.status(400).json({
                 success: false,
                 message: `Route number ${formattedRouteNumber} already exists`,
             });
        }

        const data = await Route.create(insertData);

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: data,
        });
    } catch (error) {
        console.error('Error creating route:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating route',
            error: error.message,
        });
    }
};

/**
 * @desc    Update a route (Admin function)
 * @route   PUT /api/routes/:id
 * @access  Private/Admin
 */
exports.updateRoute = async (req, res) => {
    try {
        const updateData = {};
        if (req.body.routeName) updateData.routeName = req.body.routeName;
        if (req.body.routeNumber) updateData.routeNumber = req.body.routeNumber.toUpperCase();
        if (req.body.source) {
             updateData.source = {
                  name: req.body.source.name,
                  coordinates: { type: 'Point', coordinates: req.body.source.coordinates }
             }
        }
        if (req.body.destination) {
             updateData.destination = {
                  name: req.body.destination.name,
                  coordinates: { type: 'Point', coordinates: req.body.destination.coordinates }
             }
        }
        if (req.body.stops) {
             updateData.stops = req.body.stops.map(s => ({
                name: s.name,
                coordinates: { type: 'Point', coordinates: s.coordinates },
                order: s.order
             }));
        }
        if (req.body.distance !== undefined) updateData.distance = req.body.distance;
        if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

        const data = await Route.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Route updated successfully',
            data: data,
        });
    } catch (error) {
        console.error('Error updating route:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating route',
            error: error.message,
        });
    }
};

/**
 * @desc    Delete a route (soft delete - mark as inactive)
 * @route   DELETE /api/routes/:id
 * @access  Private/Admin
 */
exports.deleteRoute = async (req, res) => {
    try {
        const routeId = req.params.id;

        const data = await Route.findByIdAndDelete(routeId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        await Bus.updateMany({ routeId: routeId }, { routeId: null, isActive: false });

        res.status(200).json({
            success: true,
            message: 'Route decommissioned and assets released successfully. 🏁',
            data: data,
        });
    } catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({
            success: false,
            message: 'Error decommissioning route',
            error: error.message,
        });
    }
};

/**
 * @desc    Find routes near a location
 * @route   GET /api/routes/nearby
 * @query   ?lng=80.2707&lat=13.0827&maxDistance=5000
 * @access  Public
 */
exports.findNearbyRoutes = async (req, res) => {
    try {
        const { lng, lat, maxDistance } = req.query;

        if (!lng || !lat) {
            return res.status(400).json({
                success: false,
                message: 'Please provide longitude (lng) and latitude (lat)',
            });
        }

        const data = await Route.findNearbyRoutes(Number(lng), Number(lat), Number(maxDistance) || 5000);

        res.status(200).json({
            success: true,
            count: data.length,
            data: data,
        });
    } catch (error) {
        console.error('Error finding nearby routes:', error);
        res.status(500).json({
            success: false,
            message: 'Error finding nearby routes',
            error: error.message,
        });
    }
};
