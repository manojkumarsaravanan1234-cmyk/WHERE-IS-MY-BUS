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

        const data = await Bus.find(query).populate('routeId').sort('busNumber');

        res.status(200).json({
            success: true,
            count: data.length,
            data: data,
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

        const formattedBusNumber = busNumber.toUpperCase();

        const existingBus = await Bus.findOne({ busNumber: formattedBusNumber });
        if (existingBus) {
             return res.status(400).json({
                 success: false,
                 message: `Bus number ${formattedBusNumber} already exists`,
             });
        }

        const bus = await Bus.create({
            busNumber: formattedBusNumber,
            routeId: routeId || null,
            driverInfo: driverInfo || {},
            isActive: false
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
 * @desc    Update bus location
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

        const bus = await Bus.findOneAndUpdate(
             { busNumber: req.params.busNumber.toUpperCase() },
             {
                 currentLocation: { type: 'Point', coordinates: [longitude, latitude] },
                 speed: speed || 0,
                 heading: heading || 0,
                 lastUpdated: Date.now()
             },
             { new: true }
        );

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found',
            });
        }

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

        const bus = await Bus.findOneAndUpdate(
             { busNumber: req.params.busNumber.toUpperCase() },
             {
                 routeId: routeId,
                 isActive: true,
                 lastUpdated: Date.now()
             },
             { new: true }
        );

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found or error starting journey',
            });
        }

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
        const bus = await Bus.findOneAndUpdate(
             { busNumber: req.params.busNumber.toUpperCase() },
             {
                 isActive: false,
                 lastUpdated: Date.now()
             },
             { new: true }
        );

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found',
            });
        }

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

        // Just fetching all active buses for now. If geospatial queries needed, use Bus.find() with $near
        const buses = await Bus.find({ isActive: true }).populate('routeId');

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
