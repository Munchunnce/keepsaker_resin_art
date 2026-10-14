// import express from 'express';
// import { APP_PORT } from './config/index.js';
// const app = express();
// import routes from './routes/index.js';
// import errorHandler from './middlewares/errorHandler.js';
// import connectDatabase from './config/database.js';


// // Database connection
// connectDatabase();
// app.use(express.json());
// app.use('/api/v1/auth', routes);

// app.use(errorHandler);
// app.listen(APP_PORT, () => console.log(`Listening on port ${APP_PORT}.`));


import express from 'express';
import { APP_PORT } from './config/index.js';
import connectDatabase from './config/database.js';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', routes);

// Error handler must be after routes
app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDatabase();

        app.listen(APP_PORT, () => {
            console.log(`🚀 Server running on port ${APP_PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exitCode = 1;
    }
};

startServer();
