import express from 'express';
import cookieParser from 'cookie-parser';
import sequelize from './helpers/dbConnection.js';
import userRouter from './fetchApi/routes/userRoute.js';
import recommendationRoute from "./fetchApi/routes/recommendationRoute.js";

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(userRouter);
app.use(recommendationRoute);

async function migrate(){
    try {
        await sequelize.sync({ alter: true });
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Error synchronizing models:', error);
    }
}

migrate();

// Example route to test JSON parsing
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

app.listen(port, () => {
  console.log(`Sample app listening at http://localhost:${port}`);
});
