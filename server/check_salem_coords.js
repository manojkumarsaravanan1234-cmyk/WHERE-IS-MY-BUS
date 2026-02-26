const mongoose = require('mongoose');
const Route = require('./models/Route');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const route = await Route.findOne({ routeName: /Salem/i });
        if (route) {
            console.log(JSON.stringify({
                name: route.routeName,
                source: route.source,
                dest: route.destination
            }, null, 2));
        } else {
            console.log("NOT_FOUND");
        }
        process.exit(0);
    });
