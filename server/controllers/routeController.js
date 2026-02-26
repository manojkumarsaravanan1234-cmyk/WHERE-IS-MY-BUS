const Route = require('../models/Route');
const Bus = require('../models/Bus');
const mongoose = require('mongoose');

/**
 * @desc    Get all routes or search by source/destination
 * @route   GET /api/routes
 * @query   ?source=Chennai&destination=Bangalore
 * @access  Public
 */
exports.getAllRoutes = async (req, res) => {
    try {
        const { source, destination } = req.query;

        let query = { isActive: true };

        // Search by source, destination or routeName (case-insensitive partial match)
        if (source || destination) {
            const searchConditions = [];

            if (source) {
                searchConditions.push({
                    $or: [
                        { 'source.name': { $regex: source, $options: 'i' } },
                        { routeName: { $regex: source, $options: 'i' } }
                    ]
                });
            }

            if (destination) {
                searchConditions.push({
                    $or: [
                        { 'destination.name': { $regex: destination, $options: 'i' } },
                        { routeName: { $regex: destination, $options: 'i' } }
                    ]
                });
            }

            query.$and = searchConditions;
        }

        const routes = await Route.find(query).sort({ routeNumber: 1 });

        res.status(200).json({
            success: true,
            count: routes.length,
            data: routes,
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

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid route ID format',
            });
        }
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        res.status(200).json({
            success: true,
            data: route,
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
 * @access  Private/Admin (can add authentication later)
 */
exports.createRoute = async (req, res) => {
    try {
        const { routeName, routeNumber, source, destination, stops, distance, estimatedDuration } = req.body;

        // Validate required fields
        if (!routeName || !routeNumber || !source || !destination) {
            return res.status(400).json({
                success: false,
                message: 'Please provide routeName, routeNumber, source, and destination',
            });
        }

        // Validate required properties within source and destination
        if (!source.name || !source.coordinates || !destination.name || !destination.coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name and coordinates for both source and destination',
            });
        }

        // Check if route number already exists
        const formattedRouteNumber = String(routeNumber).toUpperCase();
        const existingRoute = await Route.findOne({ routeNumber: formattedRouteNumber });
        if (existingRoute) {
            return res.status(400).json({
                success: false,
                message: `Route number ${formattedRouteNumber} already exists`,
            });
        }

        // Create new route
        const route = await Route.create({
            routeName,
            routeNumber: String(routeNumber).toUpperCase(),
            source: {
                name: source.name,
                coordinates: {
                    type: 'Point',
                    coordinates: source.coordinates, // [lng, lat]
                },
            },
            destination: {
                name: destination.name,
                coordinates: {
                    type: 'Point',
                    coordinates: destination.coordinates, // [lng, lat]
                },
            },
            stops: Array.isArray(stops)
                ? stops
                    .filter(stop => stop && typeof stop === 'object')
                    .map((stop, index) => ({
                        name: stop.name || `Stop ${index + 1}`,
                        coordinates: {
                            type: 'Point',
                            coordinates: stop.coordinates || [0, 0],
                        },
                        order: stop.order !== undefined ? stop.order : index,
                        estimatedTime: stop.estimatedTime || 0,
                    }))
                : [],
            distance: distance || 0,
            estimatedDuration: estimatedDuration || 0,
        });

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: route,
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

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid route ID format',
            });
        }
        const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Route updated successfully',
            data: route,
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

        if (!mongoose.Types.ObjectId.isValid(routeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid route ID format',
            });
        }

        // 1. Soft delete the route
        const route = await Route.findByIdAndUpdate(
            routeId,
            { isActive: false },
            { new: true }
        );

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        // 2. Unassign buses from this route
        await Bus.updateMany(
            { routeId: routeId },
            { $set: { routeId: null, isActive: false } }
        );

        res.status(200).json({
            success: true,
            message: 'Route decommissioned and assets released successfully. 🏁',
            data: route,
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

        const routes = await Route.findNearbyRoutes(
            parseFloat(lng),
            parseFloat(lat),
            maxDistance ? parseInt(maxDistance) : 5000
        );

        res.status(200).json({
            success: true,
            count: routes.length,
            data: routes,
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
