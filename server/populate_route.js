const mongoose = require('mongoose');
const Route = require('./models/Route');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const routeId = '6994178216699d499d729c31';
        const updated = await Route.findByIdAndUpdate(routeId, {
            distance: 28.5,
            estimatedDuration: 45,
            stops: [
                { name: 'Salem Junction', coordinates: { type: 'Point', coordinates: [78.1352, 11.6669] }, order: 1 },
                { name: 'Seelanaickenpatti', coordinates: { type: 'Point', coordinates: [78.1634, 11.6241] }, order: 2 },
                { name: 'Mallur', coordinates: { type: 'Point', coordinates: [78.1724, 11.5367] }, order: 3 },
                { name: 'Rasipuram Bus Stand', coordinates: { type: 'Point', coordinates: [78.1785, 11.4537] }, order: 4 }
            ]
        }, { new: true });
        console.log("Updated Route:", updated.routeName);
        process.exit(0);
    });
