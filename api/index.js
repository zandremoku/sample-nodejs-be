import express from 'express';
import cookieParser from 'cookie-parser';
import sequelize from './helpers/dbConnection.js';
import userRoute from './fetchApi/routes/userRoute.js';
import travelExperienceRoute from "./fetchApi/routes/travelExperienceRoute.js";
import cors from 'cors';

const app = express();
const port = 3000;

// CORS configuration - Add this BEFORE other middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001', // Your frontend URL - default is the local nextjs frotend url
    credentials: true, // If you're using cookies
}));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(userRoute);
app.use(travelExperienceRoute);

// Only run migration once, not on every cold start
let migrated = false;

async function migrate(){
    if (migrated) return;
    try {
        // In production, skip alter to avoid timeouts on cold start
        // Run migrations manually before deployment if schema changes are needed
        const shouldAlter = process.env.NODE_ENV !== 'production';
        await sequelize.sync({ alter: shouldAlter });
        console.log('All models were synchronized successfully.');
        migrated = true;
    } catch (error) {
        console.error('Error synchronizing models:', error);
        // Don't crash the app if migration fails - tables might already exist
        migrated = true;
    }
}

migrate();

// Example route to test JSON parsing
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

// Removed to be complaint with Vercel deploying - just kept for development target
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
      console.log(`Sample app listening at http://localhost:${port}`);
    });
}

export default app;
