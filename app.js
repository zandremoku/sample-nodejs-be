import express from 'express';
import sequelize from './helpers/dbConnection.js';
import User from './model/User.js';
import userRouter from './fetchApi/routes/userRoute.js';

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(userRouter);


// // Sync database
// try {
//   await sequelize.sync();
//   console.log('Database synced successfully.');
// } catch (error) {
//   console.error('Error syncing database:', error);
// }


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

// app.post('/recommandation', express.json(), (req, res) => {
//     const receivedData = req.body;
//     res.json({ message: 'Data received!', data: receivedData });
// });

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});