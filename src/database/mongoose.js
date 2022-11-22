const mongoose = require('mongoose');
const { log, success, error } = require("../helpers/Logger");

module.exports = {
    async initializeDb() {
        log('Initializing db...');

        try {
            await mongoose.connect(process.env.MONGO_URL || '', {
                keepAlive: true
            });

            success('Mongoose: Database connected');
        } catch (err) {
            error('Mongoose: Failed to connect', err);
            process.exit(1);
        }
    },
    schemas: {
        Member: require('./schemas/Member'),
    }
}