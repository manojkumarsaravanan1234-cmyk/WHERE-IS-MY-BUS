const mongoose = require('mongoose');

/**
 * Route Schema
 * Represents a bus route with source, destination, and intermediate stops
 * Uses GeoJSON Point format for location data to enable geospatial queries
 */
const routeSchema = new mongoose.Schema(
    {
        // Route identification
        routeName: {
            type: String,
            required: [true, 'Route name is required'],
            trim: true,
            maxlength: [100, 'Route name cannot exceed 100 characters'],
        },
        routeNumber: {
            type: String,
            required: [true, 'Route number is required'],
            unique: true,
            trim: true,
            uppercase: true,
            index: true,
        },

        // Source location
        source: {
            name: {
                type: String,
                required: [true, 'Source name is required'],
                trim: true,
            },
            // GeoJSON Point format: [longitude, latitude]
            coordinates: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point',
                },
                coordinates: {
                    type: [Number], // [lng, lat]
                    required: [true, 'Source coordinates are required'],
                    validate: {
                        validator: function (coords) {
                            // Validate: [longitude, latitude]
                            // longitude: -180 to 180, latitude: -90 to 90
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
        },

        // Destination location
        destination: {
            name: {
                type: String,
                required: [true, 'Destination name is required'],
                trim: true,
            },
            coordinates: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point',
                },
                coordinates: {
                    type: [Number], // [lng, lat]
                    required: [true, 'Destination coordinates are required'],
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
        },

        // Array of stops along the route
        stops: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },
                coordinates: {
                    type: {
                        type: String,
                        enum: ['Point'],
                        default: 'Point',
                    },
                    coordinates: {
                        type: [Number], // [lng, lat]
                        required: true,
                    },
                },
                order: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                estimatedTime: {
                    type: Number, // Time in minutes from start
                    default: 0,
                },
            },
        ],

        // Additional route metadata
        distance: {
            type: Number, // Total distance in kilometers
            default: 0,
        },
        estimatedDuration: {
            type: Number, // Total duration in minutes
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Create 2dsphere index for geospatial queries on source and destination
routeSchema.index({ 'source.coordinates': '2dsphere' });
routeSchema.index({ 'destination.coordinates': '2dsphere' });
routeSchema.index({ 'stops.coordinates': '2dsphere' });

// Virtual for total stops count
routeSchema.virtual('totalStops').get(function () {
    return this.stops.length;
});

// Method to find nearby routes from a given location
routeSchema.statics.findNearbyRoutes = async function (longitude, latitude, maxDistance = 5000) {
    // MongoDB does not allow more than one $near in a single query (inside $or)
    // So we perform two separate queries and merge the results

    const [sourceNearby, destNearby] = await Promise.all([
        this.find({
            'source.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: maxDistance,
                },
            },
            isActive: true,
        }),
        this.find({
            'destination.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: maxDistance,
                },
            },
            isActive: true,
        })
    ]);

    // Merge results and remove duplicates based on _id
    const combined = [...sourceNearby, ...destNearby];
    const uniqueMap = new Map();
    combined.forEach(route => {
        uniqueMap.set(route._id.toString(), route);
    });

    return Array.from(uniqueMap.values());
};

// Ensure stops are sorted by order before saving
routeSchema.pre('save', function (next) {
    if (this.stops && this.stops.length > 0) {
        this.stops.sort((a, b) => a.order - b.order);
    }
    next();
});

module.exports = mongoose.model('Route', routeSchema);
