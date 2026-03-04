const { supabase } = require('../config/database');

/**
 * @desc    Get all buses or filter by active status
 * @route   GET /api/buses
 * @query   ?active=true
 * @access  Public
 */
exports.getAllBuses = async (req, res) => {
    try {
        const { active, routeId } = req.query;

        let query = supabase.from('buses').select('*, routes(*)');

        if (active !== undefined) {
            query = query.eq('is_active', active === 'true');
        }

        if (routeId) {
            query = query.eq('route_id', routeId);
        }

        const { data, error } = await query.order('bus_number', { ascending: true });

        if (error) throw error;

        // Map for frontend compatibility
        const buses = data.map(bus => ({
            ...bus,
            _id: bus.id,
            routeId: bus.routes ? {
                ...bus.routes,
                _id: bus.routes.id,
                routeName: bus.routes.route_name,
                routeNumber: bus.routes.route_number
            } : null
        }));

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
        const { data, error } = await supabase
            .from('buses')
            .select('*, routes(*)')
            .eq('bus_number', req.params.busNumber.toUpperCase())
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found',
            });
        }

        const bus = {
            ...data,
            _id: data.id,
            routeId: data.routes ? {
                ...data.routes,
                _id: data.routes.id,
                routeName: data.routes.route_name,
                routeNumber: data.routes.route_number
            } : null
        };

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

        const { data, error } = await supabase
            .from('buses')
            .insert([
                {
                    bus_number: formattedBusNumber,
                    route_id: routeId || null,
                    driver_info: driverInfo || {},
                    is_active: false
                },
            ])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: `Bus number ${formattedBusNumber} already exists`,
                });
            }
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Bus registered successfully',
            data: { ...data, _id: data.id },
        });
    } catch (error) {
        console.error('Error creating bus:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating bus',
            error: error.message,
            details: error.details,
            hint: error.hint
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

        const { data, error } = await supabase
            .from('buses')
            .update({
                current_location: { coordinates: [longitude, latitude] },
                speed: speed || 0,
                heading: heading || 0,
                last_updated: new Date().toISOString()
            })
            .eq('bus_number', req.params.busNumber.toUpperCase())
            .select()
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bus location updated successfully',
            data: { ...data, _id: data.id },
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

        const { data, error } = await supabase
            .from('buses')
            .update({
                route_id: routeId,
                is_active: true,
                last_updated: new Date().toISOString()
            })
            .eq('bus_number', req.params.busNumber.toUpperCase())
            .select()
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found or error starting journey',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Journey started successfully',
            data: { ...data, _id: data.id },
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
        const { data, error } = await supabase
            .from('buses')
            .update({
                is_active: false,
                last_updated: new Date().toISOString()
            })
            .eq('bus_number', req.params.busNumber.toUpperCase())
            .select()
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Journey stopped successfully',
            data: { ...data, _id: data.id },
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

        const { data, error } = await supabase
            .from('buses')
            .select('*, routes(*)')
            .eq('is_active', true);

        if (error) throw error;

        // Fallback filter
        const buses = data.map(bus => ({
            ...bus,
            _id: bus.id,
            routeId: bus.routes ? {
                ...bus.routes,
                _id: bus.routes.id,
                routeName: bus.routes.route_name,
                routeNumber: bus.routes.route_number
            } : null
        }));

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
