const mongoose = require('mongoose');

/**
 * Bus Schema
 * Represents a bus with real-time location tracking
 * Uses GeoJSON Point format for current location to enable geospatial queries
 */
const busSchema = new mongoose.Schema(
    {
        // Bus identification
        busNumber: {
            type: String,
            required: [true, 'Bus number is required'],
            unique: true,
            trim: true,
            uppercase: true,
            index: true,
        },

        // Reference to the route this bus is currently on
        routeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Route',
            default: null,
        },

        // Current location using GeoJSON Point format
        currentLocation: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0],
                validate: {
                    validator: function (coords) {
                        return (
                            coords.length === 2 &&
                            coords[0] >= -180 &&
                            coords[0] <= 180 &&
                            coords[1] >= -90 &&
                            coords[1] <= 90
                        );
                    },
                    message: 'Invalid coordinates format. Use [longitude, latitude]',
                },
            },
        },

        // Movement data
        speed: {
            type: Number, // Speed in km/h
            default: 0,
            min: 0,
            max: 200, // Maximum reasonable bus speed
        },

        heading: {
            type: Number, // Direction in degrees (0-360)
            default: 0,
            min: 0,
            max: 360,
        },

        // Journey status
        isActive: {
            type: Boolean,
            default: false,
            index: true,
        },

        // Driver/Contributor information (optional)
        driverInfo: {
            name: {
                type: String,
                trim: true,
            },
            phone: {
                type: String,
                trim: true,
            },
            socketId: {
                type: String, // Current socket connection ID
            },
        },

        // Journey tracking
        currentStopIndex: {
            type: Number,
            default: 0,
        },

        journeyStartTime: {
            type: Date,
            default: null,
        },

        lastUpdated: {
            type: Date,
            default: Date.now,
            index: true,
        },

        // Location history (optional - for analytics)
        locationHistory: [
            {
                coordinates: [Number], // [lng, lat]
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                speed: Number,
            },
        ],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Create 2dsphere index for geospatial queries on current location
busSchema.index({ currentLocation: '2dsphere' });

// Compound index for efficient queries
busSchema.index({ isActive: 1, routeId: 1 });

// Virtual for time since last update
busSchema.virtual('minutesSinceUpdate').get(function () {
    if (!this.lastUpdated) return null;
    return Math.floor((Date.now() - this.lastUpdated.getTime()) / 1000 / 60);
});

// Method to update bus location
busSchema.methods.updateLocation = function (longitude, latitude, speed = 0, heading = 0) {
    this.currentLocation.coordinates = [longitude, latitude];
    this.speed = speed;
    this.heading = heading;
    this.lastUpdated = Date.now();

    // Add to location history (keep last 100 points)
    this.locationHistory.push({
        coordinates: [longitude, latitude],
        timestamp: Date.now(),
        speed,
    });

    if (this.locationHistory.length > 100) {
        this.locationHistory.shift(); // Remove oldest
    }

    return this.save();
};

// Method to start journey
busSchema.methods.startJourney = function (routeId, socketId) {
    this.routeId = routeId;
    this.isActive = true;
    this.journeyStartTime = Date.now();
    this.currentStopIndex = 0;
    this.locationHistory = [];
    if (socketId) {
        this.driverInfo.socketId = socketId;
    }
    return this.save();
};

// Method to stop journey
busSchema.methods.stopJourney = function () {
    this.isActive = false;
    this.journeyStartTime = null;
    this.driverInfo.socketId = null;
    this.speed = 0;
    return this.save();
};

// Static method to find active buses on a route
busSchema.statics.findActiveBusesByRoute = function (routeId) {
    return this.find({
        routeId,
        isActive: true,
    }).populate('routeId');
};

// Static method to find buses near a location
busSchema.statics.findNearbyBuses = function (longitude, latitude, maxDistance = 5000) {
    // maxDistance in meters (default 5km)
    return this.find({
        currentLocation: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                },
                $maxDistance: maxDistance,
            },
        },
        isActive: true,
    }).populate('routeId');
};

// Mark bus as inactive if not updated for 10 minutes
busSchema.pre('save', function (next) {
    if (this.lastUpdated) {
        const minutesSinceUpdate = Math.floor((Date.now() - this.lastUpdated.getTime()) / 1000 / 60);
        if (minutesSinceUpdate > 10 && this.isActive) {
            console.log(`⚠️ Bus ${this.busNumber} marked inactive due to no updates`);
            this.isActive = false;
        }
    }
    next();
});

module.exports = mongoose.model('Bus', busSchema);
