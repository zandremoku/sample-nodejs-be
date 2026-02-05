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

// Middleware to parse JSON bodies
// app.use(express.json());

// Example route to test JSON parsing

// app.post('/example', express.json(), (req, res) => {
//     const receivedData = req.body;
//     res.json({ message: 'Data received!', data: receivedData });
// });

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
