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

// Auto-sync models on startup (quick, no manual migration needed)
(async () => {
    try {
        const shouldAlter = process.env.NODE_ENV !== 'production';
        await sequelize.sync({ alter: shouldAlter });
        console.log('✅ Models synchronized successfully.');
    } catch (error) {
        console.error('⚠️  Model sync warning:', error.message);
    }
})();

// Example route to test JSON parsing
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

// Removed to be compliant with Vercel deploying - just kept for development target
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
      console.log(`Sample app listening at http://localhost:${port}`);
    });
}

export default app;
