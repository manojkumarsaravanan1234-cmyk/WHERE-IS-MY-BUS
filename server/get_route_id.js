const mongoose = require('mongoose');
const Route = require('./models/Route');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const route = await Route.findOne().sort({ _id: -1 }); // Get the most recently created route
        if (route) {
            console.log(`\nROUTE_NAME: ${route.routeName}`);
            console.log(`ROUTE_ID: ${route._id}\n`);
        } else {
            console.log("\nNO_ROUTES_FOUND\n");
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
