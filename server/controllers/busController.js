const Bus = require('../models/Bus');
const Route = require('../models/Route');

/**
 * @desc    Get all buses or filter by active status
 * @route   GET /api/buses
 * @query   ?active=true
 * @access  Public
 */
exports.getAllBuses = async (req, res) => {
    try {
        const { active, routeId } = req.query;

        let query = {};

        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        if (routeId) {
            query.routeId = routeId;
        }

        const buses = await Bus.find(query).populate('routeId').sort({ busNumber: 1 });

        res.status(200).json({
            success: true,
            count: buses.length,
            data: buses,
        });
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buses',
            error: error.message,
        });
    }
};

/**
 * @desc    Get single bus by bus number
 * @route   GET /api/buses/:busNumber
 * @access  Public
 */
exports.getBusByNumber = async (req, res) => {
    try {
        const bus = await Bus.findOne({ busNumber: req.params.busNumber.toUpperCase() }).populate('routeId');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found',
            });
        }

        res.status(200).json({
            success: true,
            data: bus,
        });
    } catch (error) {
        console.error('Error fetching bus:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bus',
            error: error.message,
        });
    }
};

/**
 * @desc    Register a new bus (Admin function)
 * @route   POST /api/buses
 * @access  Private/Admin
 */
exports.createBus = async (req, res) => {
    try {
        const { busNumber, routeId, driverInfo } = req.body;

        if (!busNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a bus number',
            });
        }

        // Check if bus number already exists
        const existingBus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });
        if (existingBus) {
            return res.status(400).json({
                success: false,
                message: `Bus number ${busNumber} already exists`,
            });
        }

        // If routeId provided, verify it exists
        if (routeId) {
            const route = await Route.findById(routeId);
            if (!route) {
                return res.status(404).json({
                    success: false,
                    message: 'Route not found',
                });
            }
        }

        const bus = await Bus.create({
            busNumber: busNumber.toUpperCase(),
            routeId: routeId || null,
            driverInfo: driverInfo || {},
        });

        res.status(201).json({
            success: true,
            message: 'Bus registered successfully',
            data: bus,
        });
    } catch (error) {
        console.error('Error creating bus:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating bus',
            error: error.message,
        });
    }
};

/**
 * @desc    Update bus location (Fallback to REST API if Socket.io fails)
 * @route   PUT /api/buses/:busNumber/location
 * @access  Public (Driver)
 */
exports.updateBusLocation = async (req, res) => {
    try {
        const { longitude, latitude, speed, heading } = req.body;

        if (longitude === undefined || latitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide longitude and latitude',
            });
        }

        const bus = await Bus.findOne({ busNumber: req.params.busNumber.toUpperCase() });

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found',
            });
        }

        // Update location using the model method
        await bus.updateLocation(longitude, latitude, speed || 0, heading || 0);

        res.status(200).json({
            success: true,
            message: 'Bus location updated successfully',
            data: bus,
        });
    } catch (error) {
        console.error('Error updating bus location:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating bus location',
            error: error.message,
        });
    }
};

/**
 * @desc    Start bus journey
 * @route   PUT /api/buses/:busNumber/start
 * @access  Public (Driver)
 */
exports.startBusJourney = async (req, res) => {
    try {
        const { routeId } = req.body;

        if (!routeId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a route ID',
            });
        }

        // Verify route exists
        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        }

        const bus = await Bus.findOne({ busNumber: req.params.busNumber.toUpperCase() });

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found',
            });
        }

        await bus.startJourney(routeId);

        res.status(200).json({
            success: true,
            message: 'Journey started successfully',
            data: bus,
        });
    } catch (error) {
        console.error('Error starting bus journey:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting bus journey',
            error: error.message,
        });
    }
};

/**
 * @desc    Stop bus journey
 * @route   PUT /api/buses/:busNumber/stop
 * @access  Public (Driver)
 */
exports.stopBusJourney = async (req, res) => {
    try {
        const bus = await Bus.findOne({ busNumber: req.params.busNumber.toUpperCase() });

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found',
            });
        }

        await bus.stopJourney();

        res.status(200).json({
            success: true,
            message: 'Journey stopped successfully',
            data: bus,
        });
    } catch (error) {
        console.error('Error stopping bus journey:', error);
        res.status(500).json({
            success: false,
            message: 'Error stopping bus journey',
            error: error.message,
        });
    }
};

/**
 * @desc    Find buses near a location
 * @route   GET /api/buses/nearby
 * @query   ?lng=80.2707&lat=13.0827&maxDistance=5000
 * @access  Public
 */
exports.findNearbyBuses = async (req, res) => {
    try {
        const { lng, lat, maxDistance } = req.query;

        if (!lng || !lat) {
            return res.status(400).json({
                success: false,
                message: 'Please provide longitude (lng) and latitude (lat)',
            });
        }

        const buses = await Bus.findNearbyBuses(
            parseFloat(lng),
            parseFloat(lat),
            maxDistance ? parseInt(maxDistance) : 5000
        );

        res.status(200).json({
            success: true,
            count: buses.length,
            data: buses,
        });
    } catch (error) {
        console.error('Error finding nearby buses:', error);
        res.status(500).json({
            success: false,
            message: 'Error finding nearby buses',
            error: error.message,
        });
    }
};
