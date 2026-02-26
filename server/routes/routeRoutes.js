const express = require('express');
const router = express.Router();
const {
    getAllRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    deleteRoute,
    findNearbyRoutes,
} = require('../controllers/routeController');

// @route   GET /api/routes/nearby
// @desc    Find routes near a location
// @access  Public
router.get('/nearby', findNearbyRoutes);

// @route   GET /api/routes
// @desc    Get all routes or search
// @access  Public
router.get('/', getAllRoutes);

// @route   GET /api/routes/:id
// @desc    Get single route
// @access  Public
router.get('/:id', getRouteById);

// @route   POST /api/routes
// @desc    Create new route (Admin)
// @access  Private/Admin
router.post('/', createRoute);

// @route   PUT /api/routes/:id
// @desc    Update route (Admin)
// @access  Private/Admin
router.put('/:id', updateRoute);

// @route   DELETE /api/routes/:id
// @desc    Delete route (soft delete)
// @access  Private/Admin
router.delete('/:id', deleteRoute);

module.exports = router;
