const express = require('express');
const router = express.Router();
const {
    getAllBuses,
    getBusByNumber,
    createBus,
    updateBusLocation,
    startBusJourney,
    stopBusJourney,
    findNearbyBuses,
} = require('../controllers/busController');

// @route   GET /api/buses/nearby
// @desc    Find buses near a location
// @access  Public
router.get('/nearby', findNearbyBuses);

// @route   GET /api/buses
// @desc    Get all buses
// @access  Public
router.get('/', getAllBuses);

// @route   GET /api/buses/:busNumber
// @desc    Get single bus
// @access  Public
router.get('/:busNumber', getBusByNumber);

// @route   POST /api/buses
// @desc    Register new bus (Admin)
// @access  Private/Admin
router.post('/', createBus);

// @route   PUT /api/buses/:busNumber/location
// @desc    Update bus location (Fallback)
// @access  Public (Driver)
router.put('/:busNumber/location', updateBusLocation);

// @route   PUT /api/buses/:busNumber/start
// @desc    Start bus journey
// @access  Public (Driver)
router.put('/:busNumber/start', startBusJourney);

// @route   PUT /api/buses/:busNumber/stop
// @desc    Stop bus journey
// @access  Public (Driver)
router.put('/:busNumber/stop', stopBusJourney);

module.exports = router;
