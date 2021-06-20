import mongoose, { ConnectionOptions } from 'mongoose';

import config from './config/config';
import { dump, field, sep } from './config/fmt';

const dbOptions: ConnectionOptions = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    config: { autoIndex: false },
};

(() => {
    //*------------------------------------------------------------------*/
    // * Create the database connection 
    //*------------------------------------------------------------------*/

    mongoose.connect(config.MONGO.URI, dbOptions);

    mongoose.connection.on('connected', () => {
        field('\x1b[37mDatabase', `\x1b[33m${mongoose.connection.name}\x1b[0m`);
        sep();
    });

    mongoose.connection.on('error', err => {
        dump(err.name, '\x1b[37mDatabase[\x1b[31merror\x1b[0m]');
        sep();
    });

    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose default connection disconnected');
        sep();
    });

    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            console.log('Mongoose default connection disconnected through app termination');
            sep();
            process.exit(0);
        });
    });
})();